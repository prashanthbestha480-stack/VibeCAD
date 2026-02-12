from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import tempfile
import json

# Import our custom modules
from cad_generator import CADGenerator
from llm_parser import NLPtoCADParser
from dfm_validator import DFMValidator
from cost_estimator import CostEstimator
from component_library import ComponentLibrary

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize our modules
cad_gen = CADGenerator()
nlp_parser = NLPtoCADParser()
dfm_validator = DFMValidator()
cost_estimator = CostEstimator()
component_lib = ComponentLibrary()

# Create the main app without a prefix
app = FastAPI(title="VibeCAD API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===== DATA MODELS =====

class DesignRequest(BaseModel):
    description: str
    user_id: Optional[str] = None

class Design(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    description: str
    parameters: Dict[str, Any]
    bounding_box: Optional[Dict[str, float]] = None
    dfm_validation: Optional[Dict[str, Any]] = None
    cost_estimate: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "draft"  # draft, validated, exported

class ParametricEditRequest(BaseModel):
    edit_description: str

class ExportRequest(BaseModel):
    format: str  # step, stl, dxf
    design_id: str

class CostEstimateRequest(BaseModel):
    design_id: str
    quantity: int = 100

class ComponentSearchRequest(BaseModel):
    query: str
    category: Optional[str] = None

# ===== API ENDPOINTS =====

@api_router.get("/")
async def root():
    return {
        "message": "VibeCAD API v1.0",
        "status": "operational",
        "features": [
            "Natural Language to CAD",
            "DFM Validation",
            "Cost Estimation",
            "Component Library",
            "Multi-format Export"
        ]
    }

@api_router.post("/design/generate", response_model=Design)
async def generate_design(request: DesignRequest):
    """Generate CAD design from natural language description"""
    try:
        logger.info(f"Generating design from: {request.description}")
        
        # Parse natural language to CAD parameters
        params = await nlp_parser.parse(request.description)
        logger.info(f"Parsed parameters: {json.dumps(params, indent=2)}")
        
        # Generate CAD model
        geometry_type = params.get('primary_geometry', {}).get('type', 'box')
        workplane = cad_gen.generate_custom(params.get('primary_geometry', {}))
        
        # Get bounding box
        bounding_box = cad_gen.get_bounding_box(workplane)
        
        # Validate DFM
        dfm_result = dfm_validator.validate(params)
        
        # Estimate cost (default 100 units)
        cost_result = cost_estimator.estimate_cost(params, bounding_box, quantity=100)
        
        # Create design object
        design = Design(
            user_id=request.user_id,
            description=request.description,
            parameters=params,
            bounding_box=bounding_box,
            dfm_validation=dfm_result,
            cost_estimate=cost_result,
            status="validated" if dfm_result.get('valid', False) else "draft"
        )
        
        # Save to database
        design_dict = design.model_dump()
        design_dict['created_at'] = design_dict['created_at'].isoformat()
        design_dict['updated_at'] = design_dict['updated_at'].isoformat()
        
        await db.designs.insert_one(design_dict)
        
        logger.info(f"Design created with ID: {design.id}")
        
        return design
        
    except Exception as e:
        logger.error(f"Error generating design: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate design: {str(e)}")

@api_router.get("/design/{design_id}", response_model=Design)
async def get_design(design_id: str):
    """Get design by ID"""
    try:
        design = await db.designs.find_one({"id": design_id}, {"_id": 0})
        
        if not design:
            raise HTTPException(status_code=404, detail="Design not found")
        
        # Convert ISO strings back to datetime
        design['created_at'] = datetime.fromisoformat(design['created_at'])
        design['updated_at'] = datetime.fromisoformat(design['updated_at'])
        
        return Design(**design)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching design: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/designs", response_model=List[Design])
async def list_designs(user_id: Optional[str] = None, limit: int = 50):
    """List all designs"""
    try:
        query = {"user_id": user_id} if user_id else {}
        designs = await db.designs.find(query, {"_id": 0}).limit(limit).to_list(limit)
        
        for design in designs:
            design['created_at'] = datetime.fromisoformat(design['created_at'])
            design['updated_at'] = datetime.fromisoformat(design['updated_at'])
        
        return [Design(**d) for d in designs]
        
    except Exception as e:
        logger.error(f"Error listing designs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/design/{design_id}/edit")
async def edit_design(design_id: str, request: ParametricEditRequest):
    """Edit design parametrically"""
    try:
        # Get existing design
        design = await db.designs.find_one({"id": design_id}, {"_id": 0})
        if not design:
            raise HTTPException(status_code=404, detail="Design not found")
        
        # Parse edit description
        edit_prompt = f"""Current design parameters: {json.dumps(design['parameters'])}

User requested edit: {request.edit_description}

Update the parameters JSON to reflect the requested changes. Output ONLY the updated JSON."""
        
        updated_params = await nlp_parser.parse(edit_prompt)
        
        # Regenerate with updated params
        workplane = cad_gen.generate_custom(updated_params.get('primary_geometry', {}))
        bounding_box = cad_gen.get_bounding_box(workplane)
        dfm_result = dfm_validator.validate(updated_params)
        cost_result = cost_estimator.estimate_cost(updated_params, bounding_box, quantity=100)
        
        # Update design in database
        await db.designs.update_one(
            {"id": design_id},
            {
                "$set": {
                    "parameters": updated_params,
                    "bounding_box": bounding_box,
                    "dfm_validation": dfm_result,
                    "cost_estimate": cost_result,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "design_id": design_id,
            "updated_parameters": updated_params,
            "dfm_validation": dfm_result,
            "cost_estimate": cost_result
        }
        
    except Exception as e:
        logger.error(f"Error editing design: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/design/{design_id}/validate")
async def validate_design(design_id: str):
    """Run DFM validation on design"""
    try:
        design = await db.designs.find_one({"id": design_id}, {"_id": 0})
        if not design:
            raise HTTPException(status_code=404, detail="Design not found")
        
        dfm_result = dfm_validator.validate(design['parameters'])
        
        # Update design
        await db.designs.update_one(
            {"id": design_id},
            {"$set": {"dfm_validation": dfm_result}}
        )
        
        return dfm_result
        
    except Exception as e:
        logger.error(f"Error validating design: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/design/{design_id}/cost")
async def estimate_cost(design_id: str, quantity: int = 100):
    """Estimate manufacturing cost"""
    try:
        design = await db.designs.find_one({"id": design_id}, {"_id": 0})
        if not design:
            raise HTTPException(status_code=404, detail="Design not found")
        
        bounding_box = design.get('bounding_box', {})
        params = design['parameters']
        
        # Get cost for single process
        cost_result = cost_estimator.estimate_cost(params, bounding_box, quantity)
        
        # Get comparison across processes
        cost_comparison = cost_estimator.compare_processes(params, bounding_box, quantity)
        
        return {
            "current_process": cost_result,
            "process_comparison": cost_comparison,
            "quantity": quantity
        }
        
    except Exception as e:
        logger.error(f"Error estimating cost: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/design/{design_id}/export")
async def export_design(design_id: str, format: str = "step"):
    """Export design to STEP/STL/DXF"""
    try:
        design = await db.designs.find_one({"id": design_id}, {"_id": 0})
        if not design:
            raise HTTPException(status_code=404, detail="Design not found")
        
        # Regenerate CAD model
        params = design['parameters']
        workplane = cad_gen.generate_custom(params.get('primary_geometry', {}))
        
        # Create temporary file
        temp_dir = tempfile.gettempdir()
        filename = f"vibecad_{design_id}.{format.lower()}"
        filepath = os.path.join(temp_dir, filename)
        
        # Export based on format
        if format.lower() == "step" or format.lower() == "stp":
            success = cad_gen.export_step(workplane, filepath)
        elif format.lower() == "stl":
            success = cad_gen.export_stl(workplane, filepath)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
        
        if not success:
            raise HTTPException(status_code=500, detail="Export failed")
        
        # Return file
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type="application/octet-stream"
        )
        
    except Exception as e:
        logger.error(f"Error exporting design: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/components/search")
async def search_components(query: str, category: Optional[str] = None):
    """Search component library"""
    try:
        results = component_lib.search(query, category)
        return {
            "query": query,
            "category": category,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Error searching components: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/components/categories")
async def get_categories():
    """Get all component categories"""
    try:
        categories = component_lib.get_all_categories()
        return {
            "categories": categories,
            "count": len(categories)
        }
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/components/{category}")
async def get_category_components(category: str):
    """Get all components in a category"""
    try:
        components = component_lib.get_category(category)
        if not components:
            raise HTTPException(status_code=404, detail=f"Category not found: {category}")
        
        return {
            "category": category,
            "components": components,
            "count": len(components)
        }
    except Exception as e:
        logger.error(f"Error fetching category components: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/design/{design_id}")
async def delete_design(design_id: str):
    """Delete a design"""
    try:
        result = await db.designs.delete_one({"id": design_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Design not found")
        
        return {"success": True, "message": "Design deleted"}
    except Exception as e:
        logger.error(f"Error deleting design: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
