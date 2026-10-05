import test from 'node:test';
import assert from 'node:assert/strict';
import { isReportDoc, reportingDocuments } from '../src/lib/erp-reporting';

test('only approved nondeleted receipts are recognized as revenue', () => {
  for (const status of ['draft', 'sent', 'cancelled', '', undefined]) assert.equal(isReportDoc({type:'receipt',status}),false);
  assert.equal(isReportDoc({type:'receipt',status:'approved'}),true);
  assert.equal(isReportDoc({type:'receipt',status:'approved',deleted:true}),false);
  assert.equal(isReportDoc({type:'invoice',status:'approved'}),false);
  assert.equal(reportingDocuments([{type:'receipt',status:'draft'}, {type:'receipt',status:'approved'}]).length,1);
});
