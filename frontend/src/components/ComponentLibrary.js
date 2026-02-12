import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ComponentLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('nema_motors');
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchComponents(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/components/categories`);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchComponents = async (category) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/components/${category}`);
      setComponents(response.data.components || []);
    } catch (error) {
      console.error('Error fetching components:', error);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API}/components/search`, {
        params: { query: searchQuery }
      });
      setComponents(response.data.results || []);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error searching components:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="component-library">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Standard Component Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search components (e.g., NEMA17, M4, 608)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-slate-900 border-slate-600 text-white"
                data-testid="component-search-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedCategory || 'search'} onValueChange={setSelectedCategory}>
        <TabsList className="bg-slate-800 border border-slate-700 flex-wrap h-auto">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white capitalize flex items-center justify-between">
                  {category.replace(/_/g, ' ')}
                  <Badge className="bg-purple-500/20 text-purple-300">
                    {components.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading...</div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {components.map((component, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-purple-500/50 transition"
                      >
                        <div className="font-semibold text-white mb-2">{component.name}</div>
                        <div className="space-y-1 text-sm">
                          {Object.entries(component)
                            .filter(([key]) => key !== 'name' && key !== 'category')
                            .slice(0, 5)
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-400 capitalize">
                                  {key.replace(/_/g, ' ')}:
                                </span>
                                <span className="text-white">
                                  {typeof value === 'number' ? value : value}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ComponentLibrary;
