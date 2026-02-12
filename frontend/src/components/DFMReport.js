import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const DFMReport = ({ validation }) => {
  const { valid, issues, warnings, suggestions, confidence, dfm_score } = validation;

  return (
    <div className="space-y-6" data-testid="dfm-report">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">DFM Validation Report</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">DFM Score</div>
                <div className="text-3xl font-bold text-purple-400">{dfm_score}%</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Confidence</div>
                <div className="text-3xl font-bold text-pink-400">{Math.round(confidence * 100)}%</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className={valid ? 'bg-green-900/20 border-green-500/50' : 'bg-yellow-900/20 border-yellow-500/50'}>
            <AlertDescription className="flex items-center">
              {valid ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2 text-green-400" />
                  <span className="text-green-300">Design is manufacturable with current parameters</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                  <span className="text-yellow-300">Design has issues that need attention before manufacturing</span>
                </>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {issues && issues.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
              Critical Issues ({issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {issues.map((issue, index) => (
              <div key={index} className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/50">
                    {issue.type}
                  </Badge>
                  <span className="text-sm text-red-400 font-semibold uppercase">{issue.severity}</span>
                </div>
                <div className="text-white mb-2">{issue.message}</div>
                {issue.recommendation && (
                  <div className="text-sm text-gray-400">
                    <span className="font-semibold">Recommendation:</span> {issue.recommendation}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {warnings && warnings.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
              Warnings ({warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {warnings.map((warning, index) => (
              <div key={index} className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                    {warning.type}
                  </Badge>
                  <span className="text-sm text-yellow-400 font-semibold uppercase">{warning.severity}</span>
                </div>
                <div className="text-white mb-2">{warning.message}</div>
                {warning.recommendation && (
                  <div className="text-sm text-gray-400">
                    <span className="font-semibold">Recommendation:</span> {warning.recommendation}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {suggestions && suggestions.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-400" />
              Suggestions ({suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                    {suggestion.type}
                  </Badge>
                  {suggestion.current_value && (
                    <span className="text-sm text-blue-400">
                      Current: {suggestion.current_value}mm
                    </span>
                  )}
                </div>
                <div className="text-white">{suggestion.message}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(!issues || issues.length === 0) && (!warnings || warnings.length === 0) && (!suggestions || suggestions.length === 0) && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <div className="text-xl font-semibold text-white mb-2">Perfect Design!</div>
            <div className="text-gray-400">No issues, warnings, or suggestions. Ready for manufacturing.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DFMReport;
