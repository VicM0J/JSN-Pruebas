
import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RepositionList } from "@/components/repositions/RepositionList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileX, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateReposition, setShowCreateReposition] = useState(false);

  // Consulta para obtener datos de resumen en tiempo real
  const { data: summary } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/summary", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Error al cargar resumen');
      return response.json();
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
    enabled: !!user,
  });

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-medium">Cargando tablero...</div>
        </div>
      </div>
    );
  }

  // Early return if no user is authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-600 font-semibold text-lg mb-4">
            Sesión no válida
          </div>
          <div className="text-gray-600 mb-4">
            Por favor, inicia sesión nuevamente.
          </div>
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors"
          >
            Ir a Login
          </button>
        </div>
      </div>
    );
  }

  const canCreateRepositions = user?.area === 'corte' || user?.area === 'bordado' || user?.area === 'ensamble' || user?.area === 'plancha' || user?.area === 'calidad' || user?.area === 'admin';

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Encabezado dinámico */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                Tablero de Reposiciones - {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h1>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Área: {user.area?.charAt(0).toUpperCase() + user.area?.slice(1)}
                </Badge>
                {summary && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Clock className="w-3 h-3 mr-1" />
                    Actualizado: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3">
             
              
              {/* Indicador de rendimiento */}
              {summary && (
                <div className="text-right">
                  <div className="text-sm text-purple-100">Rendimiento del día</div>
                  <div className="flex items-center gap-2 text-xl font-bold">
                    <TrendingUp className="w-5 h-5" />
                    {summary.dailyEfficiency || 0}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barra de búsqueda mejorada */}
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar reposiciones por folio, solicitante, modelo..."
                  className="pl-12 py-3 text-lg border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Tarjetas de estadísticas dinámicas */}
        <StatsCards />


        {/* Lista de reposiciones */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <FileX className="w-5 h-5" />
            Reposiciones Activas
          </h3>
          <RepositionList userArea={user.area} />
        </div>
      </div>
    </Layout>
  );
}
