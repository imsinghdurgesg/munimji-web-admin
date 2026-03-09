import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProductStore } from '../store/productStore';
import { Button } from '../components/Button';
import { Store, Package, Settings } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchProducts();
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchProducts]);

  const totalProducts = products.length;
  const catalogProducts = products.filter((p) => p.catalogVisible).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your products and catalog</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {isLoading ? '...' : totalProducts}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Catalog Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {isLoading ? '...' : catalogProducts}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Catalog Status</p>
                <p className={`text-lg font-semibold mt-2 ${shop?.catalogEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {shop?.catalogEnabled ? 'Active' : 'Disabled'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="primary"
              className="justify-start"
              leftIcon={<Package className="w-5 h-5" />}
              onClick={() => navigate('/products')}
            >
              Manage Products
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              leftIcon={<Store className="w-5 h-5" />}
              onClick={() => shop?.catalogSlug && window.open(`https://munimji.store/${shop.catalogSlug}`, '_blank')}
              disabled={!shop?.catalogEnabled}
            >
              View Catalog
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              leftIcon={<Settings className="w-5 h-5" />}
              onClick={() => navigate('/settings')}
            >
              Catalog Settings
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              leftIcon={<Package className="w-5 h-5" />}
              disabled
            >
              View Orders (Coming Soon)
            </Button>
          </div>
        </div>

      {/* Catalog Info */}
      {shop?.catalogEnabled && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">Your Catalog URL</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-4 py-2 rounded border border-primary-200 text-primary-900">
              https://munimji.store/{shop.catalogSlug}
            </code>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.open(`https://munimji.store/${shop.catalogSlug}`, '_blank')}
            >
              View
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
