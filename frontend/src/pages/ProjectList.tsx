import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen } from 'lucide-react';
import api from '../api/client';
import type { Project } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export default function ProjectList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<{ projects: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newProject: { name: string; description: string }) => {
      const res = await api.post('/projects', newProject);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setName('');
      setDescription('');
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, description });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-destructive bg-destructive/10 p-4 rounded-md">Failed to load projects.</div>;
  }

  const projects = data?.projects || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={16} /> New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card border border-dashed border-border/60 shadow-sm rounded-xl text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full text-primary">
            <FolderOpen size={36} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">Get started by creating a new project to organize your tasks and collaborate with your team.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} variant="outline" className="mt-2">Create Project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link 
              key={project.id} 
              to={`/projects/${project.id}`}
              className="group flex flex-col bg-card border border-border shadow-sm rounded-xl p-6 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full"
            >
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{project.name}</h3>
              <p className="text-muted-foreground text-sm line-clamp-2 flex-grow">
                {project.description || 'No description provided.'}
              </p>
              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input 
            label="Project Name" 
            placeholder="e.g. Website Redesign" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
          <Input 
            label="Description (Optional)" 
            placeholder="Briefly describe the project goals" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
