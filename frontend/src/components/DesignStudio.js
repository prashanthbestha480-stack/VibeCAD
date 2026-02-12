import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CADViewer from '@/components/CADViewer';
import DFMReport from '@/components/DFMReport';
import CostEstimate from '@/components/CostEstimate';
import ComponentLibrary from '@/components/ComponentLibrary';
import { Loader2, Download, Home, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DesignStudio = ({ onBackToHome }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentDesign, setCurrentDesign] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('design');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a design description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API}/design/generate`, {
        description: description,
        user_id: 'demo_user'
      });

      setCurrentDesign(response.data);
      setActiveTab('view');
    } catch (err) {
      console.error('Error generating design:', err);
      setError(err.response?.data?.detail || 'Failed to generate design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!currentDesign) return;

    try {
      const response = await axios.post(`${API}/design/${currentDesign.id}/export`, null, {
        params: { format },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vibecad_${currentDesign.id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting design:', err);
      setError('Failed to export design');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800" data-testid="design-studio">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToHome}
              className="text-gray-300 hover:text-white"
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
          </div>
          
          {currentDesign && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('step')}
                className="border-slate-600 text-gray-300 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                STEP
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('stl')}
                className="border-slate-600 text-gray-300 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                STL
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="design" data-testid="tab-design">Design Input</TabsTrigger>
            <TabsTrigger value="view" data-testid="tab-view">3D View</TabsTrigger>
            <TabsTrigger value="dfm" data-testid="tab-dfm" disabled={!currentDesign}>DFM Report</TabsTrigger>
            <TabsTrigger value="cost" data-testid="tab-cost" disabled={!currentDesign}>Cost Analysis</TabsTrigger>
            <TabsTrigger value="library" data-testid="tab-library">Component Library</TabsTrigger>
          </TabsList>

          {/* Design Input Tab */}
          <TabsContent value="design" data-testid="design-input-panel">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                    Describe Your Design
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Example: Create a motor bracket for a 35mm NEMA23 stepper motor. Mounting holes for M4 bolts. Material: aluminum. Add a reinforcement rib on the backplate. Total height should not exceed 50mm."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[200px] bg-slate-900 border-slate-600 text-white"
                    data-testid="design-description-input"
                  />
                  
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    data-testid="generate-design-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Design...
                      </>
                    ) : (
                      'Generate CAD Model'
                    )}
                  </Button>

                  {error && (
                    <Alert variant="destructive" data-testid="error-message">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Example Designs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div 
                    className="p-3 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800 transition"
                    onClick={() => setDescription('Create a motor bracket for NEMA17 stepper motor. Aluminum 6061. Wall thickness 2.5mm. Add mounting holes for M3 bolts.')}
                  >
                    <div className="font-semibold text-white mb-1">NEMA17 Motor Bracket</div>
                    <div className="text-sm text-gray-400">Aluminum bracket with M3 mounting holes</div>
                  </div>
                  
                  <div 
                    className="p-3 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800 transition"
                    onClick={() => setDescription('Create a cylindrical housing with 50mm outer diameter, 40mm inner diameter, 30mm height. Material: ABS plastic for 3D printing. Add ventilation holes.')}
                  >
                    <div className="font-semibold text-white mb-1">Cylindrical Housing</div>
                    <div className="text-sm text-gray-400">ABS plastic housing for 3D printing</div>
                  </div>
                  
                  <div 
                    className="p-3 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800 transition"
                    onClick={() => setDescription('Design a simple rectangular enclosure, 100mm x 80mm x 50mm. Wall thickness 2mm. Include mounting tabs at each corner with 4mm holes. Material: aluminum.')}
                  >
                    <div className="font-semibold text-white mb-1">Rectangular Enclosure</div>
                    <div className="text-sm text-gray-400">Aluminum box with mounting tabs</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 3D View Tab */}
          <TabsContent value="view" data-testid="cad-viewer-panel">
            {currentDesign ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <CADViewer design={currentDesign} />
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

          {/* DFM Tab */}
          <TabsContent value="dfm">
            {currentDesign?.dfm_validation && <DFMReport validation={currentDesign.dfm_validation} />}
          </TabsContent>

          {/* Cost Tab */}
          <TabsContent value="cost">
            {currentDesign && <CostEstimate design={currentDesign} />}
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library">
            <ComponentLibrary />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DesignStudio;
