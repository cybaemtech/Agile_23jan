import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Team, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define the form schema
const projectFormSchema = z.object({
  name: z.string().min(3, { message: "Project name must be at least 3 characters" }).trim(),
  key: z.string()
        .min(2, { message: "Project key must be at least 2 characters" })
        .max(10, { message: "Project key must be at most 10 characters" })
        .refine(val => /^[A-Z0-9]+$/.test(val), { 
          message: "Project key must contain only uppercase letters and numbers (A-Z, 0-9)" 
        }),
  description: z.string().optional(),
  teamId: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED"]).default("ACTIVE"),
  category: z.enum(["CLIENT", "IN_HOUSE"]).default("IN_HOUSE"),
  githubUrl: z.string().url({ message: "Please enter a valid GitHub URL" }).optional().or(z.literal("")),
  startDate: z.string().optional(),
  targetDate: z.string().optional().refine((date) => {
    if (!date) return true; // Optional field
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }, { message: "Please enter a valid date" }),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface CreateProjectProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teams: Team[];
  userId: number;
  currentUser?: User;
}

export function CreateProject({ 
  isOpen, 
  onClose, 
  onSuccess,
  teams,
  userId,
  currentUser
}: CreateProjectProps) {
  const { toast } = useToast();
  
  // Check if current user is admin
  const isAdmin = currentUser?.role === 'ADMIN';
  
  // Set up the form
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      teamId: teams.length > 0 ? teams[0].id.toString() : "none",
      status: "ACTIVE",
      category: "IN_HOUSE",
      githubUrl: "",
      startDate: "",
      targetDate: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const projectData = {
        name: data.name,
        key: data.key.toUpperCase(), // Ensure key is uppercase
        description: data.description || "",
        teamId: data.teamId && data.teamId !== "none" ? parseInt(data.teamId) : null, // Use null instead of undefined
        status: data.status,
        category: data.category,
        createdBy: userId,
        githubUrl: data.githubUrl || null,
        startDate: data.startDate || null,
        targetDate: data.targetDate || null,
      };
      
      console.log("Submitting project data:", projectData);
      
      const response = await apiRequest("POST", "/projects", projectData);
      
      console.log("Project creation success:", response);
      
      toast({
        title: "Project created",
        description: "The project has been created successfully.",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating project:", error);
      console.error("Error details:", error?.response?.data);
      
      // Check if it's a validation or conflict error with field-specific errors
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        
        // Set field-specific errors
        apiErrors.forEach((err: { path: string; message: string }) => {
          if (err.path === 'key') {
            form.setError('key', { message: err.message });
          } else if (err.path === 'name') {
            form.setError('name', { message: err.message });
          } else if (err.path === 'teamId') {
            form.setError('teamId', { message: err.message });
          } else if (err.path === 'startDate') {
            form.setError('startDate', { message: err.message });
          } else if (err.path === 'targetDate') {
            form.setError('targetDate', { message: err.message });
          }
        });
        
        toast({
          title: "Validation error",
          description: "Please check the form fields and try again.",
          variant: "destructive",
        });
      } else {
        // Generic error
        toast({
          title: "Error",
          description: "Could not create the project. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create New Project</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter project name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Key</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g. PROJ, CRM, HR" 
                      maxLength={10} 
                      style={{ textTransform: 'uppercase' }}
                      onChange={(e) => {
                        // Convert to uppercase and only allow A-Z and 0-9
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        console.log("Project key input:", e.target.value, "->", value);
                        field.onChange(value);
                      }}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Short uppercase key used for work item IDs (e.g., PROJ-123)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter project description"
                      value={field.value || ""}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      When the project is planned to begin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Expected completion date for the project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Category field - only visible to admins */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CLIENT">Client Project</SelectItem>
                        <SelectItem value="IN_HOUSE">In-House Project</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select whether this is a client project or an internal project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* GitHub URL field - visible for CLIENT projects or to admins */}
            {(form.watch("category") === "CLIENT" || isAdmin) && (
              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      GitHub Repository URL
                      {form.watch("category") === "CLIENT" ? " (Required for Client Projects)" : " (Optional)"}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="https://github.com/owner/repository" 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to the GitHub repository for this project. This will be used for source code tracking and integration.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team (Optional)</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No team</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You can assign a team to this project or leave it unassigned.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
