import { createRoot } from 'react-dom/client';
import DocActions from '../src/app/doc/[id]/DocActions';

const toolbar=document.querySelector('.doc-toolbar');
if(toolbar){
  const title=toolbar.querySelector('strong')?.textContent||'QA Document';
  const root=document.createElement('div');
  toolbar.replaceWith(root);
  createRoot(root).render(<DocActions title={title}/>);
}
