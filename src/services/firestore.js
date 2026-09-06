import {collection,doc,setDoc,deleteDoc,getDocs,query,where} from 'firebase/firestore';import {db} from './firebase';
export const saveWorkspace=workspace=>setDoc(doc(db,'workspaces',workspace.id),workspace,{merge:true});
export const saveProject=project=>setDoc(doc(db,'projects',project.id),project,{merge:true});
export const saveTask=task=>setDoc(doc(db,'tasks',task.id),task,{merge:true});
export const saveComment=comment=>setDoc(doc(db,'comments',comment.id),comment,{merge:true});
export const saveActivity=activity=>setDoc(doc(db,'activityLogs',activity.id),activity,{merge:true});
export const removeDoc=(name,id)=>deleteDoc(doc(db,name,id));
export async function loadWorkspaceData(workspaceId){const [ps,ts,cs,as]=await Promise.all([getDocs(query(collection(db,'projects'),where('workspaceId','==',workspaceId))),getDocs(query(collection(db,'tasks'),where('workspaceId','==',workspaceId))),getDocs(query(collection(db,'comments'))),getDocs(query(collection(db,'activityLogs'),where('workspaceId','==',workspaceId)))]);return{projects:ps.docs.map(x=>({id:x.id,...x.data()})),tasks:ts.docs.map(x=>({id:x.id,...x.data()})),comments:cs.docs.map(x=>({id:x.id,...x.data()})),activities:as.docs.map(x=>({id:x.id,...x.data()}))}}
