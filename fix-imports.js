import fs from 'fs';
import path from 'path';

const files = [
  'plugins/recruitment/backend/src/service/candidate.service.js',
  'plugins/recruitment/backend/src/service/campaign.service.js',
  'plugins/recruitment/backend/src/controller/candidate.controller.js',
  'plugins/recruitment/backend/src/controller/campaign.controller.js',
  'plugins/forms/backend/src/service/form.service.js',
  'plugins/forms/backend/src/service/form-response.service.js',
  'plugins/forms/backend/src/controller/form.controller.js'
];

for (const file of files) {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(
      /@campus-os\/shared\/errors\/index\.js/g,
      '@campus-os/shared/errors'
    );
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed', file);
  } else {
    console.warn('Not found', file);
  }
}
