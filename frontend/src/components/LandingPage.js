import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="text-2xl font-bold text-white">VibeCAD</span>
          </div>
          <Button 
            onClick={onGetStarted}
            data-testid="get-started-btn"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Launch Studio
          </Button>
        </nav>

        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/50">
            Design Mechanical Parts in Plain English
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            From Idea to CAD
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              in 30 Seconds
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            AI-powered mechanical design platform. Generate production-ready CAD models, validate manufacturing feasibility, and estimate costs—all from natural language.
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-6"
          >
            Start Designing Now
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✍️</span>
              </div>
              <CardTitle className="text-white">Natural Language → CAD</CardTitle>
              <CardDescription className="text-gray-400">
                Describe your part in plain English. Our AI interprets mechanical specs and generates parametric 3D models instantly.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <CardTitle className="text-white">Real-time DFM Validation</CardTitle>
              <CardDescription className="text-gray-400">
                100+ manufacturing rules check wall thickness, tolerances, and feasibility. Prevent costly failures before production.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <CardTitle className="text-white">Instant Cost Estimates</CardTitle>
              <CardDescription className="text-gray-400">
                Compare CNC, 3D printing, and injection molding costs. Design with manufacturing budget in mind.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">10x</div>
            <div className="text-gray-400">Faster Design</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-400 mb-2">50+</div>
            <div className="text-gray-400">Component Library</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">100+</div>
            <div className="text-gray-400">DFM Rules</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-400 mb-2">3</div>
            <div className="text-gray-400">Export Formats</div>
          </div>
        </div>

        <div className="text-center">
          <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-3xl text-white mb-2">
                Ready to revolutionize your mechanical design workflow?
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg mb-4">
                Join engineers building the future with AI-powered CAD
              </CardDescription>
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-white text-purple-900 hover:bg-gray-100 text-lg px-8 py-6"
              >
                Launch VibeCAD Studio
              </Button>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
