import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronLeft, Trash2, Filter, Edit2 } from 'lucide-react';
import api from '../api/client';
import type { Project, Task, TaskStatus, User } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('unassigned');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  type ProjectResponse = Project & { tasks: Task[] };

  const { data, isLoading, isError } = useQuery<ProjectResponse>({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data;
    }
  });

  const { data: usersList } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    }
  });

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskDueDate('');
    setNewTaskAssignee('unassigned');
    setNewTaskStatus('todo');
    setNewTaskPriority('medium');
  };

  const handleOpenProjectEdit = () => {
    if (data) {
      setEditProjectName(data.name);
      setEditProjectDesc(data.description || '');
      setIsProjectEditModalOpen(true);
    }
  };

  const editProjectMutation = useMutation({
    mutationFn: async (updatedProject: { name: string; description: string }) => {
      const res = await api.patch(`/projects/${id}`, updatedProject);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] }); 
      setIsProjectEditModalOpen(false);
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const res = await api.post(`/projects/${id}/tasks`, newTask);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      closeTaskModal();
    }
  });

  const editTaskMutation = useMutation({
    mutationFn: async (updatedTask: Partial<Task> & { id: string }) => {
      const { id, ...payload } = updatedTask;
      const res = await api.patch(`/tasks/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      closeTaskModal();
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const res = await api.patch(`/tasks/${taskId}`, { status });
      return res.data;
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['project', id] });
      const previousData = queryClient.getQueryData<ProjectResponse>(['project', id]);
      queryClient.setQueryData<ProjectResponse>(['project', id], (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: Task) => t.id === taskId ? { ...t, status } : t)
        };
      });
      return { previousData };
    },
    onError: (_err, _newVal, context) => {
      if (context?.previousData) queryClient.setQueryData(['project', id], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    }
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-muted rounded-md mb-8"></div>
      <div className="flex gap-4"><div className="h-96 flex-1 bg-muted rounded-xl"></div><div className="h-96 flex-1 bg-muted rounded-xl"></div><div className="h-96 flex-1 bg-muted rounded-xl"></div></div>
    </div>;
  }

  if (isError || !data) {
    return <div className="text-destructive bg-destructive/10 p-4 rounded-md">Failed to load project details or you don't have access.</div>;
  }

  const handleEditProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editProjectMutation.mutate({ name: editProjectName, description: editProjectDesc });
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: newTaskTitle, 
      description: newTaskDesc, 
      priority: newTaskPriority,
      status: newTaskStatus,
      assignee_id: newTaskAssignee !== 'unassigned' ? newTaskAssignee : null,
      due_date: newTaskDueDate || null
    };

    if (editingTask) {
      editTaskMutation.mutate({ id: editingTask.id, ...payload } as any);
    } else {
      createTaskMutation.mutate(payload as any);
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description || '');
    setNewTaskDueDate(task.due_date ? task.due_date.substring(0, 10) : '');
    setNewTaskAssignee(task.assignee_id || 'unassigned');
    setNewTaskStatus(task.status);
    setNewTaskPriority(task.priority);
    setIsTaskModalOpen(true);
  };

  let filteredTasks = data.tasks;
  if (filterAssignee !== 'all' && filterAssignee !== 'unassigned') {
    filteredTasks = filteredTasks.filter(t => t.assignee_id === filterAssignee);
  } else if (filterAssignee === 'unassigned') {
    filteredTasks = filteredTasks.filter(t => !t.assignee_id);
  }

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    done: filteredTasks.filter(t => t.status === 'done')
  };

  const isOwner = data.owner_id === user?.id;

  const getAssigneeName = (id: string | null) => {
    if (!id) return 'Unassigned';
    if (id === user?.id) return 'Me';
    return usersList?.find(u => u.id === id)?.name || 'Assigned';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="px-2" title="Back to Projects">
           <ChevronLeft size={20} />
        </Button>
        
        {/* Updated Project Title row with Edit option */}
        <div className="flex-1 group">
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-3xl font-bold tracking-tight text-primary">{data.name}</h1>
            {isOwner && (
               <button 
                 title="Edit Project Details"
                 onClick={handleOpenProjectEdit}
                 className="text-muted-foreground/50 hover:text-primary transition-colors hidden group-hover:inline-block"
               >
                 <Edit2 size={16} />
               </button>
            )}
          </div>
          {data.description && <p className="text-muted-foreground mt-1 text-sm font-medium">{data.description}</p>}
        </div>
        
        <Button onClick={() => { closeTaskModal(); setIsTaskModalOpen(true); }} className="gap-2 shrink-0">
          <Plus size={16} /> Add Task
        </Button>

        {isOwner && (
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive hover:text-white shrink-0 shadow-none" onClick={() => {
            if(window.confirm('Are you absolutely sure you want to delete this project? All tasks will be lost.')) deleteProjectMutation.mutate();
          }}>
             <Trash2 size={16} /> Delete
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
         <Filter size={18} className="text-muted-foreground" />
         <span className="text-sm font-semibold">Filter Assignee:</span>
         <select 
           className="h-8 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
           value={filterAssignee}
           onChange={e => setFilterAssignee(e.target.value)}
         >
            <option value="all">All Tasks</option>
            <option value="unassigned">Unassigned Tasks</option>
            {usersList?.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} {u.id === user?.id ? '(Me)' : ''}
              </option>
            ))}
         </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(status => (
          <div key={status} className="bg-muted/30 border border-border rounded-xl p-4 min-h-[500px]">
             <h3 className="font-semibold text-lg flex justify-between items-center mb-4 capitalize text-foreground">
                {status.replace('_', ' ')}
                <span className="text-sm font-normal bg-card shadow-sm border border-border text-foreground px-2.5 py-0.5 rounded-full">
                   {tasksByStatus[status].length}
                </span>
             </h3>
             <div className="space-y-3">
               {tasksByStatus[status].map(task => (
                 <div key={task.id} className="bg-card border border-border flex flex-col justify-between shadow-sm p-4 rounded-lg gap-3 group relative cursor-default hover:shadow-md hover:border-primary/50 transition-all min-h-[120px]">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 pr-2">
                           <h4 className="font-semibold text-sm leading-tight text-foreground inline-block align-middle mr-2">
                             {task.title}
                           </h4>
                           {(isOwner || task.assignee_id === user?.id) && (
                             <>
                               <button
                                 title="Edit Task" 
                                 onClick={() => handleEditClick(task)}
                                 className="text-muted-foreground/50 hover:text-primary transition-colors inline-block align-middle hidden group-hover:inline-block mr-1"
                               >
                                  <Edit2 size={13} />
                               </button>
                               <button
                                 title="Delete Task" 
                                 onClick={() => { if(window.confirm('Are you certain you want to delete this task?')) deleteTaskMutation.mutate(task.id); }}
                                 className="text-muted-foreground/50 hover:text-destructive transition-colors inline-block align-middle hidden group-hover:inline-block"
                               >
                                  <Trash2 size={13} />
                               </button>
                             </>
                           )}
                        </div>
                        <span className={cn("text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm shrink-0", 
                           task.priority === 'high' ? 'bg-destructive/10 text-destructive' : 
                           task.priority === 'medium' ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary')}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{task.description}</p>}
                      
                      <div className="flex flex-wrap gap-2 mt-3 pt-2">
                         {task.due_date && (
                           <span className="text-[10px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded shadow-sm border border-border">
                             📅 {new Date(task.due_date).toLocaleDateString()}
                           </span>
                         )}
                         {task.assignee_id ? (
                           <span className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded shadow-sm border border-primary/20">
                             👤 {getAssigneeName(task.assignee_id)}
                           </span>
                         ) : (
                           <span className="text-[10px] bg-background text-muted-foreground/60 px-1.5 py-0.5 border border-dashed border-border rounded">
                             Unassigned
                           </span>
                         )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 mt-1 border-t border-border/50">
                       {status !== 'todo' && (
                         <Button variant="ghost" className="text-[11px] h-6 px-2.5 py-0 rounded flex-1 bg-muted/50 hidden group-hover:flex" onClick={() => updateTaskStatusMutation.mutate({ taskId: task.id, status: status === 'done' ? 'in_progress' : 'todo' })}>
                           ⬅ Back
                         </Button>
                       )}
                       {status !== 'done' && (
                         <Button variant="secondary" className="text-[11px] h-6 px-2.5 py-0 rounded flex-1 hidden group-hover:flex" onClick={() => updateTaskStatusMutation.mutate({ taskId: task.id, status: status === 'todo' ? 'in_progress' : 'done' })}>
                           Advance ➡
                         </Button>
                       )}
                    </div>
                 </div>
               ))}
               {tasksByStatus[status].length === 0 && (
                 <div className="text-center p-6 border-2 border-dashed border-border/60 rounded-lg text-muted-foreground text-sm flex flex-col items-center justify-center">
                   <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-2 opacity-50">📋</div>
                   No tasks here
                 </div>
               )}
             </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isTaskModalOpen} onClose={closeTaskModal} title={editingTask ? "Edit Task Details" : "Create New Task"}>
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <Input 
            label="Task Title" 
            placeholder="What needs to be done?" 
            value={newTaskTitle} 
            onChange={e => setNewTaskTitle(e.target.value)} 
            required 
          />
          <Input 
            label="Description (Optional)" 
            placeholder="Add context or details..." 
            value={newTaskDesc} 
            onChange={e => setNewTaskDesc(e.target.value)} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-semibold text-foreground">Status</label>
               <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer" value={newTaskStatus} onChange={e => setNewTaskStatus(e.target.value as TaskStatus)}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
               </select>
            </div>
            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-semibold text-foreground">Priority</label>
               <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer" value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as any)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
               </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-semibold text-foreground">Assignee</label>
               <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer" value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)}>
                  <option value="unassigned">Unassigned</option>
                  {usersList?.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.id === user?.id ? '(Me)' : ''}
                    </option>
                  ))}
               </select>
            </div>
            <Input 
              label="Due Date (Optional)" 
              type="date"
              value={newTaskDueDate} 
              onChange={e => setNewTaskDueDate(e.target.value)} 
            />
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={closeTaskModal}>Cancel</Button>
            <Button type="submit" isLoading={createTaskMutation.isPending || editTaskMutation.isPending}>
              {editingTask ? "Save Details" : "Add Task"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* NEW: Project Edit Modal */}
      <Modal isOpen={isProjectEditModalOpen} onClose={() => setIsProjectEditModalOpen(false)} title="Edit Project">
        <form onSubmit={handleEditProjectSubmit} className="space-y-4">
          <Input 
            label="Project Name" 
            placeholder="e.g. Website Redesign" 
            value={editProjectName} 
            onChange={e => setEditProjectName(e.target.value)} 
            required 
          />
          <Input 
            label="Description (Optional)" 
            placeholder="Briefly describe the project goals" 
            value={editProjectDesc} 
            onChange={e => setEditProjectDesc(e.target.value)} 
          />
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsProjectEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={editProjectMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
