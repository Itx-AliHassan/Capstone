export const seedUsers = [
 {id:'demo',name:'Demo User',email:'demo@example.com',role:'owner'},
 {id:'maya',name:'Maya Chen',email:'maya@example.com',role:'admin'},
 {id:'omar',name:'Omar Khan',email:'omar@example.com',role:'member'},
 {id:'sara',name:'Sara Ali',email:'sara@example.com',role:'viewer'}
]
export const seedWorkspaces = [{id:'ws-1',name:'Hackathon HQ',color:'#2563EB',icon:'H',ownerId:'demo',defaultView:'kanban',members:seedUsers.map(({id,name,email,role})=>({id,name,email,role}))}]
export const seedProjects = [
 {id:'p-1',workspaceId:'ws-1',name:'Launch Sprint',description:'Ship the capstone workspace manager.',color:'#2563EB',icon:'🚀',memberIds:['demo','maya','omar'],template:'Launch',columns:['Todo','In Progress','Review','Done']},
 {id:'p-2',workspaceId:'ws-1',name:'Website Redesign',description:'Refresh the marketing experience.',color:'#7C3AED',icon:'🎨',memberIds:['demo','maya'],template:'Design',columns:['Backlog','Design','Build','Done']}
]
export const seedTasks = [
 {id:'t-1',projectId:'p-1',workspaceId:'ws-1',title:'Configure Firebase Auth',description:'Connect Firebase Authentication.',status:'In Progress',priority:'High',dueDate:'2026-09-08',assigneeId:'demo',labels:['backend','auth'],attachments:[],subtasks:[{id:'s-1',title:'Create Firebase project',completed:true},{id:'s-2',title:'Add environment variables',completed:false}],createdAt:'2026-09-01T09:00:00Z',createdBy:'demo'},
 {id:'t-2',projectId:'p-1',workspaceId:'ws-1',title:'Build Kanban interactions',description:'Drag tasks between columns.',status:'Review',priority:'Urgent',dueDate:'2026-09-10',assigneeId:'maya',labels:['frontend'],attachments:[],subtasks:[],createdAt:'2026-09-02T10:00:00Z',createdBy:'demo'},
 {id:'t-3',projectId:'p-1',workspaceId:'ws-1',title:'README for judges',description:'Explain setup and architecture.',status:'Todo',priority:'Medium',dueDate:'2026-09-12',assigneeId:'omar',labels:['docs'],attachments:[],subtasks:[],createdAt:'2026-09-03T11:00:00Z',createdBy:'demo'},
 {id:'t-4',projectId:'p-2',workspaceId:'ws-1',title:'Homepage wireframe',description:'Create responsive wireframe.',status:'Design',priority:'Low',dueDate:'2026-09-15',assigneeId:'maya',labels:['design'],attachments:[],subtasks:[],createdAt:'2026-09-03T12:00:00Z',createdBy:'demo'}
]
export const seedComments=[]
