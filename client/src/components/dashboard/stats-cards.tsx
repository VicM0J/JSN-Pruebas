
import { Card, CardContent } from "@/components/ui/card";
import {
  FileX,
  LayoutGrid,
  Hourglass,
  BadgeCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

type Stats = {
  activeRepositions: number;
  myAreaRepositions: number;
  pendingRepositions: number;
  completedToday: number;
  pausedRepositions: number;
  urgentRepositions: number;
  completedThisWeek: number;
  totalProcessingTime: number;
};

interface StatsCardsProps {
  areaFilter?: string;
}

export function StatsCards({ areaFilter = "all" }: StatsCardsProps) {
  const { user } = useAuth();
  
  const { data: stats, isLoading, error, isFetching, dataUpdatedAt } = useQuery<Stats>({
    queryKey: ["/api/dashboard/reposition-stats", areaFilter],
    queryFn: async () => {
      const url = areaFilter && areaFilter !== "all" 
        ? `/api/dashboard/reposition-stats?area=${areaFilter}`
        : "/api/dashboard/reposition-stats";
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        
        // Intentar parsear el error como JSON
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar estadísticas');
        } catch (parseError) {
          // Si no se puede parsear como JSON, es probable que sea HTML
          const errorText = await response.text();
          if (errorText.includes('<!DOCTYPE')) {
            throw new Error('Error de autenticación - sesión inválida');
          }
          throw new Error('Error al cargar estadísticas');
        }
      }
      
      const data = await response.json();
      return data;
    },
    refetchInterval: 10000, // Actualizar cada 10 segundos para datos más frescos
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true, // Continuar actualizando en background
    enabled: !!user, // Solo ejecutar si hay usuario autenticado
    retry: (failureCount, error) => {
      // No reintentar si es error de autenticación
      if (error?.message?.includes('401') || error?.message?.includes('Sesión expirada')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5000, // Considerar datos obsoletos después de 5 segundos
  });

  if (error) {
    return (
      <div className="mb-8">
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 font-semibold mb-2">
              Error al cargar estadísticas
            </div>
            <div className="text-sm text-gray-500 mb-4">
              {error.message}
            </div>
            {error.message.includes('Sesión expirada') && (
              <button
                onClick={() => window.location.href = '/auth'}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Iniciar Sesión
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-gradient-to-r from-purple-100 to-purple-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getStatsData = () => {
    const baseStats = [
      {
        title: "Reposiciones Activas",
        value: stats?.activeRepositions || 0,
        icon: FileX,
        gradient: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-100",
        iconColor: "text-purple-600",
        description: "En proceso",
        widthClass: "w-full md:w-1/2 lg:w-1/3"
      },
      {
        title: "En Mi Área",
        value: stats?.myAreaRepositions || 0,
        icon: LayoutGrid,
        gradient: "from-green-500 to-green-600",
        bgColor: "bg-green-100",
        iconColor: "text-green-600",
        description: `${user?.area?.charAt(0).toUpperCase()}${user?.area?.slice(1)} - ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
        widthClass: "w-full md:w-1/2 lg:w-1/3"
      },
      {
        title: "Pendientes",
        value: stats?.pendingRepositions || 0,
        icon: Hourglass,
        gradient: "from-yellow-500 to-yellow-600",
        bgColor: "bg-yellow-100",
        iconColor: "text-yellow-600",
        description: "Por aprobar",
        widthClass: "w-full md:w-1/2 lg:w-1/3"
      },
      {
        title: "Urgentes",
        value: stats?.urgentRepositions || 0,
        icon: AlertTriangle,
        gradient: "from-red-500 to-red-600",
        bgColor: "bg-red-100",
        iconColor: "text-red-600",
        description: "Prioridad alta",
        widthClass: "w-full md:w-1/2 lg:w-1/3"
      }
    ];

    return baseStats;
  };

  const statsData = getStatsData();

  return (
    <div className="space-y-6">
      {/* Indicador de actualización */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-2">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isFetching ? 'bg-green-500 animate-pulse shadow-sm' : 'bg-gray-300'}`}></div>
          <span className="font-medium">
            {isFetching ? 'Actualizando estadísticas...' : `Actualizado: ${new Date(dataUpdatedAt || Date.now()).toLocaleTimeString('es-ES')}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium">
            Filtro: {areaFilter === "all" ? "Todas las áreas" : areaFilter.charAt(0).toUpperCase() + areaFilter.slice(1)}
          </span>
          <span className="text-xs">Usuario: {user?.area?.toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => (
        <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg group bg-white dark:bg-slate-800 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              {/* Icono y valor principal */}
              <div className="flex items-center justify-between">
                <div className={`w-14 h-14 ${stat.bgColor} dark:bg-opacity-20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <stat.icon className={`${stat.iconColor} dark:text-opacity-80`} size={24} />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                    {stat.value}
                  </p>
                </div>
              </div>
              
              {/* Título y descripción */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  {stat.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {stat.description}
                </p>
              </div>

              {/* Barra de progreso visual */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${stat.gradient} h-2 rounded-full transition-all duration-500 ease-out shadow-sm`}
                  style={{ 
                    width: `${Math.min(Math.max((typeof stat.value === 'string' ? parseInt(stat.value) : stat.value) / 10 * 100, 15), 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        ))}
      </div>
    </div>
  );
}
