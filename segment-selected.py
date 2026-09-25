"""Read-only connectivity analysis; never deletes or cuts model geometry."""
import bpy,numpy as np,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'selected-review'
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'models/Yui-Selected-Source.blend'))
o=bpy.data.objects['Yui Selected Original Surface'];m=o.data
co=np.empty(len(m.vertices)*3,np.float32);m.vertices.foreach_get('co',co);co=co.reshape(-1,3)
unique,inverse=np.unique(co,axis=0,return_inverse=True)
edges=np.empty(len(m.edges)*2,np.int32);m.edges.foreach_get('vertices',edges);edges=inverse[edges.reshape(-1,2)]
mask=unique[:,2]<.83;edges=edges[mask[edges[:,0]]&mask[edges[:,1]]]
parent=np.arange(len(unique),dtype=np.int32)
def find(a):
 while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
 return a
for a,b in edges:
 a=find(a);b=find(b)
 if a!=b:parent[max(a,b)]=min(a,b)
labels=np.array([find(i) for i in range(len(unique))],np.int32);labels=labels[inverse]
roots,count=np.unique(labels[co[:,2]<.83],return_counts=True);order=np.argsort(count)[::-1]
rows=[]
for j in order[:12]:
 pts=co[labels==roots[j]];rows.append({'root':int(roots[j]),'vertices':int(count[j]),'min':pts.min(0).tolist(),'max':pts.max(0).tolist()})
legroots={}
for s,sign in [('L',1),('R',-1)]:
 ids=np.flatnonzero((co[:,0]*sign>0)&(co[:,2]<.05));r,c=np.unique(labels[ids],return_counts=True);legroots[s]=int(r[np.argmax(c)])
regions={}
for side,sign in [('left',1),('right',-1)]:
 selected=[]
 for r in roots:
  p=co[labels==r]
  if len(p) and np.min(p[:,0]*sign)>.001 and np.max(p[:,0]*sign)<.16 and p[:,1].max()<-.045:selected.append(r)
 regions[side]=np.isin(labels,selected)
np.savez_compressed(OUT/'leg-regions.npz',**regions)
report={'method':'Connected surfaces below z=.83, joining exact duplicate positions for analysis only','leg_roots':legroots,'components':rows,'separate_legs':legroots['L']!=legroots['R']}
(OUT/'segmentation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
