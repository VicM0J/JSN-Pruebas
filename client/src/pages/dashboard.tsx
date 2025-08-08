
import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RepositionList } from "@/components/repositions/RepositionList";
import { RepositionForm } from "@/components/repositions/RepositionForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileX, TrendingUp, Clock, AlertTriangle, Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateReposition, setShowCreateReposition] = useState(false);
  const [areaFilter, setAreaFilter] = useState(() => {
    // Por defecto mostrar el área del usuario, excepto admin y envios que ven todas
    if (user?.area === 'admin' || user?.area === 'envios') {
      return "all";
    }
    return user?.area || "all";
  });

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

  // Set area filter to user's area by default (except for admin and envios who see all by default)
  if (user && areaFilter === "all" && user.area && user.area !== 'admin' && user.area !== 'envios') {
    setAreaFilter(user.area);
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
              {/* Botón Nueva Solicitud */}
              {canCreateRepositions && (
                <Button
                  onClick={() => setShowCreateReposition(true)}
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600 transition-all duration-200"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Solicitud
                </Button>
              )}
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

        

        {/* Tarjetas de estadísticas dinámicas */}
        <StatsCards areaFilter={areaFilter} />


        {/* Lista de reposiciones */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <FileX className="w-5 h-5" />
            Reposiciones Activas
            <Badge variant="outline" className="ml-2">
              {areaFilter === "all" ? "Todas las áreas" : 
               areaFilter.charAt(0).toUpperCase() + areaFilter.slice(1)}
            </Badge>
          </h3>
          <RepositionList userArea={user.area} areaFilter={areaFilter} />
        </div>

        {/* Modal para crear nueva reposición */}
        {showCreateReposition && (
          <RepositionForm
            isOpen={showCreateReposition}
            onClose={() => setShowCreateReposition(false)}
            userArea={user.area || ''}
          />
        )}
      </div>
    </Layout>
  );
}
