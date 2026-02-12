import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import CADViewer3D from '@/components/CADViewer3D';
import DFMReport from '@/components/DFMReport';
import CostEstimate from '@/components/CostEstimate';
import ComponentLibrary from '@/components/ComponentLibrary';
import { Loader2, Download, Home, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DesignStudio = ({ onBackToHome }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentDesign, setCurrentDesign] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('design');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a design description');
      return;
    }

    if (description.trim().length < 20) {
      setError('Please provide a more detailed description (at least 20 characters)');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 1000);

    try {
      const response = await axios.post(`${API}/design/generate`, {
        description: description,
        user_id: 'demo_user'
      });

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentDesign(response.data);
      setActiveTab('view');
      
      // Success notification
      const dfmScore = response.data.dfm_validation?.dfm_score || 0;
      const status = response.data.status || 'generated';
      
      if (dfmScore >= 70) {
        toast.success('Design generated successfully! High DFM score - ready for manufacturing.');
      } else if (dfmScore >= 40) {
        toast.success('Design generated! Check DFM report for recommendations.');
      } else {
        toast.warning('Design generated but has manufacturing issues. Review DFM report.');
      }
      
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      console.error('Error generating design:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to generate design. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const handleExport = async (format) => {
    if (!currentDesign) return;

    try {
      toast.info(`Exporting ${format.toUpperCase()} file...`);
      
      const response = await axios.post(`${API}/design/${currentDesign.id}/export`, null, {
        params: { format },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vibecad_${currentDesign.id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`${format.toUpperCase()} file downloaded successfully!`);
    } catch (err) {
      console.error('Error exporting design:', err);
      toast.error('Failed to export design. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800" data-testid="design-studio">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToHome}
              className="text-gray-300 hover:text-white hover:bg-slate-800"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">V</span>
              </div>
              <span className="text-xl font-bold text-white">VibeCAD Studio</span>
            </div>
            {currentDesign && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Design Generated
              </Badge>
            )}
          </div>
          
          {currentDesign && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('step')}
                className="border-slate-600 text-gray-300 hover:text-white hover:bg-slate-800"
              >
                <Download className="w-4 h-4 mr-2" />
                STEP
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('stl')}
                className="border-slate-600 text-gray-300 hover:text-white hover:bg-slate-800"
              >
                <Download className="w-4 h-4 mr-2" />
                STL
              </Button>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        {loading && progress > 0 && (
          <div className="px-4 pb-2">
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="design" data-testid="tab-design">Design Input</TabsTrigger>
            <TabsTrigger value="view" data-testid="tab-view" disabled={!currentDesign}>3D View</TabsTrigger>
            <TabsTrigger value="dfm" data-testid="tab-dfm" disabled={!currentDesign}>DFM Report</TabsTrigger>
            <TabsTrigger value="cost" data-testid="tab-cost" disabled={!currentDesign}>Cost Analysis</TabsTrigger>
            <TabsTrigger value="library" data-testid="tab-library">Component Library</TabsTrigger>
          </TabsList>

          {/* Design Input Tab */}
          <TabsContent value="design" data-testid="design-input-panel">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/30 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                    Describe Your Design
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-2">
                    Use natural language to describe mechanical parts. Be specific about dimensions, materials, and features.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Example: Create a motor bracket for a 35mm NEMA23 stepper motor. Mounting holes for M4 bolts. Material: aluminum. Add a reinforcement rib on the backplate. Total height should not exceed 50mm."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (error) setError(null);
                    }}
                    className="min-h-[200px] bg-slate-900 border-slate-600 text-white focus:border-purple-500 transition-colors"
                    data-testid="design-description-input"
                  />
                  
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{description.length} characters</span>
                    <span className={description.length >= 20 ? 'text-green-400' : 'text-yellow-400'}>
                      {description.length >= 20 ? '✓ Ready' : 'Need 20+ chars'}
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || description.trim().length < 20}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="generate-design-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Design... ({Math.round(progress)}%)
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate CAD Model
                      </>
                    )}
                  </Button>

                  {error && (
                    <Alert variant="destructive" data-testid="error-message" className="bg-red-900/20 border-red-500/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {currentDesign && (
                    <Alert className="bg-green-900/20 border-green-500/50">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-300">
                        Design generated successfully! Switch to 3D View to see results.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Example Designs</CardTitle>
                  <p className="text-sm text-gray-400 mt-2">
                    Click any example to automatically fill the description field
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div 
                    className="p-4 bg-slate-900 rounded-lg cursor-pointer hover:bg-purple-900/20 hover:border hover:border-purple-500/50 transition-all"
                    onClick={() => setDescription('Create a motor bracket for NEMA17 stepper motor. Aluminum 6061. Wall thickness 2.5mm. Add mounting holes for M3 bolts in standard NEMA17 pattern.')}
                  >
                    <div className="font-semibold text-white mb-1 flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      NEMA17 Motor Bracket
                    </div>
                    <div className="text-sm text-gray-400">Aluminum bracket with M3 mounting holes</div>
                  </div>
                  
                  <div 
                    className="p-4 bg-slate-900 rounded-lg cursor-pointer hover:bg-purple-900/20 hover:border hover:border-purple-500/50 transition-all"
                    onClick={() => setDescription('Create a cylindrical housing with 50mm outer diameter, 40mm inner diameter, 30mm height. Material: ABS plastic for 3D printing. Add 4 ventilation holes 8mm diameter evenly spaced around circumference.')}
                  >
                    <div className="font-semibold text-white mb-1 flex items-center">
                      <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                      Cylindrical Housing
                    </div>
                    <div className="text-sm text-gray-400">ABS plastic housing for 3D printing</div>
                  </div>
                  
                  <div 
                    className="p-4 bg-slate-900 rounded-lg cursor-pointer hover:bg-purple-900/20 hover:border hover:border-purple-500/50 transition-all"
                    onClick={() => setDescription('Design a rectangular enclosure, 100mm x 80mm x 50mm. Wall thickness 2mm. Include mounting tabs at each corner with 4mm holes. Material: aluminum 6061. Add ventilation slots on sides.')}
                  >
                    <div className="font-semibold text-white mb-1 flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      Rectangular Enclosure
                    </div>
                    <div className="text-sm text-gray-400">Aluminum box with mounting tabs</div>
                  </div>
                  
                  <div 
                    className="p-4 bg-slate-900 rounded-lg cursor-pointer hover:bg-purple-900/20 hover:border hover:border-purple-500/50 transition-all"
                    onClick={() => setDescription('Create a simple L-bracket, 60mm x 60mm x 40mm height. Material: steel. Wall thickness 3mm. Add 2 mounting holes on each side, 5mm diameter, 10mm from edges.')}
                  >
                    <div className="font-semibold text-white mb-1 flex items-center">
                      <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                      L-Bracket
                    </div>
                    <div className="text-sm text-gray-400">Steel angle bracket for mounting</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tabs remain the same */}
          <TabsContent value="view" data-testid="cad-viewer-panel">
            {currentDesign ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <CADViewer3D design={currentDesign} />
                </div>
                
                <div className="space-y-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Design Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <div className="text-gray-400">Description</div>
                        <div className="text-white">{currentDesign.description}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Status</div>
                        <Badge className={currentDesign.status === 'validated' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}>
                          {currentDesign.status}
                        </Badge>
                      </div>
                      {currentDesign.bounding_box && (
                        <>
                          <div>
                            <div className="text-gray-400">Dimensions (mm)</div>
                            <div className="text-white">
                              {Math.round(currentDesign.bounding_box.length)} × {Math.round(currentDesign.bounding_box.width)} × {Math.round(currentDesign.bounding_box.height)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">Volume</div>
                            <div className="text-white">{Math.round(currentDesign.bounding_box.volume / 1000)} cm³</div>
                          </div>
                        </>
                      )}
                      {currentDesign.parameters?.material && (
                        <div>
                          <div className="text-gray-400">Material</div>
                          <div className="text-white">{currentDesign.parameters.material.replace(/_/g, ' ').toUpperCase()}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {currentDesign.dfm_validation && (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white">DFM Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-purple-400">
                          {currentDesign.dfm_validation.dfm_score}%
                        </div>
                        <div className="text-sm text-gray-400 mt-2">
                          {currentDesign.dfm_validation.valid ? 'Manufacturing ready' : 'Needs adjustments'}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-16 text-center">
                  <div className="text-gray-400 text-lg">No design generated yet. Go to Design Input to create one!</div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dfm">
            {currentDesign?.dfm_validation && <DFMReport validation={currentDesign.dfm_validation} />}
          </TabsContent>

          <TabsContent value="cost">
            {currentDesign && <CostEstimate design={currentDesign} />}
          </TabsContent>

          <TabsContent value="library">
            <ComponentLibrary />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DesignStudio;
