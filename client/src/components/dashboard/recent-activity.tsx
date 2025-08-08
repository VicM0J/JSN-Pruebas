import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileX,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  User,
  MapPin
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface ActivityItem {
  id: number;
  type: 'created' | 'transferred' | 'completed' | 'approved' | 'rejected' | 'timer_started' | 'timer_stopped';
  repositionId: number;
  folio: string;
  description: string;
  timestamp: string;
  userArea: string;
  userName: string;
  fromArea?: string;
  toArea?: string;
  urgencia?: 'urgente' | 'intermedio' | 'poco_urgente';
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'created': return FileX;
    case 'transferred': return ArrowRight;
    case 'completed': return CheckCircle;
    case 'approved': return CheckCircle;
    case 'rejected': return XCircle;
    case 'timer_started': return Clock;
    case 'timer_stopped': return Clock;
    default: return Activity;
  }
};

const getActivityColor = (type: string, urgencia?: string) => {
  if (urgencia === 'urgente') return 'border-red-200 bg-red-50';

  switch (type) {
    case 'created': return 'border-purple-200 bg-purple-50';
    case 'transferred': return 'border-blue-200 bg-blue-50';
    case 'completed': return 'border-green-200 bg-green-50';
    case 'approved': return 'border-green-200 bg-green-50';
    case 'rejected': return 'border-red-200 bg-red-50';
    case 'timer_started': return 'border-orange-200 bg-orange-50';
    case 'timer_stopped': return 'border-teal-200 bg-teal-50';
    default: return 'border-gray-200 bg-gray-50';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'created': return 'Creada';
    case 'transferred': return 'Transferida';
    case 'completed': return 'Completada';
    case 'approved': return 'Aprobada';
    case 'rejected': return 'Rechazada';
    case 'timer_started': return 'Cronómetro iniciado';
    case 'timer_stopped': return 'Cronómetro detenido';
    default: return 'Actividad';
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Hace un momento';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `Hace ${diffInDays}d`;
};

const getAreaDisplayName = (area: string) => {
  const names: Record<string, string> = {
    'patronaje': 'Patronaje',
    'corte': 'Corte',
    'bordado': 'Bordado',
    'ensamble': 'Ensamble',
    'plancha': 'Plancha/Empaque',
    'calidad': 'Calidad',
    'operaciones': 'Operaciones',
    'envios': 'Envíos',
    'diseño': 'Diseño',
    'almacen': 'Almacén',
    'admin': 'Administración'
  };
  return names[area] || area.charAt(0).toUpperCase() + area.slice(1);
};

export function RecentActivity() {
  const { user } = useAuth();

  const { data: activities, isLoading, error } = useQuery<ActivityItem[]>({
    queryKey: ["/api/dashboard/recent-activity"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/recent-activity", {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        // Intentar parsear el error como JSON
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar actividad reciente');
        } catch (parseError) {
          // Si no se puede parsear como JSON, es probable que sea HTML
          const errorText = await response.text();
          if (errorText.includes('<!DOCTYPE')) {
            throw new Error('Error de autenticación - sesión inválida');
          }
          throw new Error('Error al cargar actividad reciente');
        }
      }

      const data = await response.json();
      // Asegurar que siempre retornemos un array
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 15000, // Actualizar cada 15 segundos
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true, // Continuar actualizando en background
    staleTime: 10000, // Considerar datos obsoletos después de 10 segundos
    enabled: !!user, // Solo ejecutar si hay usuario autenticado
    retry: (failureCount, error) => {
      // No reintentar si es error de autenticación
      if (error?.message?.includes('401') || error?.message?.includes('Sesión expirada')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  if (error) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
            <Activity className="w-5 h-5" />
            Actividad Reciente en Reposiciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 font-semibold mb-2">
              Error al cargar actividad
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
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
            <Activity className="w-5 h-5" />
            Actividad Reciente en Reposiciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-slate-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-slate-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-purple-800 dark:text-purple-300">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Actividad Reciente en Reposiciones
          </div>
          <Badge variant="outline" className="text-xs">
            {activities?.length || 0} eventos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Activity className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p>No hay actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {(Array.isArray(activities) ? activities : []).map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type, activity.urgencia);

              return (
                <div
                  key={`${activity.id}-${activity.timestamp}`}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${colorClass} dark:bg-opacity-20 dark:border-opacity-30`}
                >
                  {/* Icono de actividad */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.urgencia === 'urgente' ? 'bg-red-100 dark:bg-red-900' : 'bg-white dark:bg-slate-700'
                  } shadow-sm`}>
                    <Icon className={`w-5 h-5 ${
                      activity.urgencia === 'urgente' ? 'text-red-600' :
                      activity.type === 'completed' || activity.type === 'approved' ? 'text-green-600' :
                      activity.type === 'rejected' ? 'text-red-600' :
                      activity.type === 'transferred' ? 'text-blue-600' :
                      'text-purple-600'
                    }`} />
                  </div>

                  {/* Contenido de la actividad */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {activity.folio}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(activity.type)}
                          </Badge>
                          {activity.urgencia === 'urgente' && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Urgente
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {activity.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{activity.userName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{getAreaDisplayName(activity.userArea)}</span>
                          </div>
                          {activity.fromArea && activity.toArea && (
                            <div className="flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" />
                              <span>{getAreaDisplayName(activity.fromArea)} → {getAreaDisplayName(activity.toArea)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right ml-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}