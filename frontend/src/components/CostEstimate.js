import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingDown, Clock, Package } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CostEstimate = ({ design }) => {
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(false);
  const [costData, setCostData] = useState(null);

  useEffect(() => {
    if (design?.cost_estimate) {
      setCostData({ current_process: design.cost_estimate });
    }
  }, [design]);

  const fetchCost = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/design/${design.id}/cost`, null, {
        params: { quantity }
      });
      setCostData(response.data);
    } catch (error) {
      console.error('Error fetching cost:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="space-y-6" data-testid="cost-estimate">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Manufacturing Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                className="bg-slate-900 border-slate-600 text-white"
                data-testid="quantity-input"
              />
            </div>
            <Button
              onClick={fetchCost}
              disabled={loading}
              className="mt-7 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate Cost'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {costData && (
        <>
          <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/50">
            <CardContent className="py-8">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-sm text-gray-300 mb-2">Unit Cost</div>
                  <div className="text-4xl font-bold text-white">
                    {formatCurrency(costData.current_process.unit_cost)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-2">Total Cost</div>
                  <div className="text-4xl font-bold text-white">
                    {formatCurrency(costData.current_process.total_cost)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-2">Quantity</div>
                  <div className="text-4xl font-bold text-white">
                    {costData.current_process.quantity}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Cost Breakdown</CardTitle>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                  {costData.current_process.process.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(costData.current_process.breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                    <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-white font-semibold">{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-start space-x-3 p-3 bg-slate-900 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <div className="text-sm text-gray-400">Lead Time</div>
                    <div className="text-white font-semibold">{costData.current_process.lead_time_days}</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-900 rounded-lg">
                  <Package className="w-5 h-5 text-pink-400 mt-1" />
                  <div>
                    <div className="text-sm text-gray-400">Part Weight</div>
                    <div className="text-white font-semibold">{costData.current_process.mass_kg} kg</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-900 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <div className="text-sm text-gray-400">Best For</div>
                    <div className="text-white font-semibold text-sm">{costData.current_process.best_for}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {costData.process_comparison && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Process Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costData.process_comparison.map((process, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        index === 0
                          ? 'bg-green-900/20 border-green-500/50'
                          : 'bg-slate-900 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge className={index === 0 ? 'bg-green-500/20 text-green-300' : 'bg-slate-700'}>
                            {process.process.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                          {index === 0 && (
                            <span className="text-sm text-green-400 font-semibold">Recommended</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">
                            {formatCurrency(process.unit_cost)}
                          </div>
                          <div className="text-sm text-gray-400">per unit</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Total: </span>
                          <span className="text-white font-semibold">{formatCurrency(process.total_cost)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Lead Time: </span>
                          <span className="text-white font-semibold">{process.lead_time_days}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default CostEstimate;
