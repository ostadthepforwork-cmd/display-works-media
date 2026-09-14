import React from 'react';
import { createRoot } from 'react-dom/client';
import ErpDataExport from '../src/app/admin/dashboard/ErpDataExport';

createRoot(document.getElementById('root')!).render(<ErpDataExport showToast={(message, type) => {
  document.title = `${type || 'success'}:${message}`;
}}/>);

