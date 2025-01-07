const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { env } = require('process');

const BASE_URL = 'https://0c3d-2401-4900-8856-dbe2-31a3-a1f2-5c72-49a2.ngrok-free.app';
// const BASE_URL = 'http://localhost:3000';

const args = process.argv.slice(2);
const projectId = args[0];
const branchId = args[1];
const token = process.env.DIGIA_TOKEN;

// const projectId = "677bad6e819829ef9f050be2"
// const branchId = "677bada8679bf77d4262f74a"
// const token = "?wubr>hlenr^e(`@7_%/qO>>A~EmGs8125f04f071407447979b3048ab27b8b93cc04c643c8cb194c56ea86b6d6ee15"
// Validate projectId
if (!projectId) {
  console.error('Please provide a projectId.');
  process.exit(1);
}

// Function to delete specific folders
function deleteFolders(folders) {
  folders.forEach((folder) => {
    const dirPath = path.join(__dirname, '..', folder);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Deleted folder: ${dirPath}`);
    } else {
      console.log(`Folder not found: ${dirPath}`);
    }
  });
}

// Function to process and save data based on the structure
function processAndSaveData(parentFolderName, folderName, data, fileName = 'default') {
  const dirPath = path.join(__dirname, '..', parentFolderName, folderName);
  fs.mkdirSync(dirPath, { recursive: true });

  if (Array.isArray(data)) {
    data.forEach((item) => {
      const yamlData = yaml.dump(item);
      let currentFileName = fileName;

      if (item.name) currentFileName = item.name;
      if (item.displayName) currentFileName = item.displayName;
      if (item.functionName) currentFileName = item.functionName;

      const yamlFilePath = path.join(dirPath, `${currentFileName}.yaml`);
      fs.writeFileSync(yamlFilePath, yamlData);

      if (item.functionRawString) {
        const jsFilePath = path.join(dirPath, `${currentFileName}.js`);
        fs.writeFileSync(jsFilePath, item.functionRawString);
      }

      console.log(`Created: ${yamlFilePath}`);
    });
  } else {
    const yamlData = yaml.dump(data);

    if (parentFolderName === 'design' && data.TYPOGRAPHY) {
      folderName = 'font-tokens';
    }
    if (parentFolderName === 'design' && data.THEME) {
      folderName = 'color-tokens';
    }
    if (parentFolderName === 'project' && data.appDetails?.displayName) {
      folderName = data.appDetails.displayName;
    }

    const yamlFilePath = path.join(dirPath, `${folderName}.yaml`);
    fs.writeFileSync(yamlFilePath, yamlData);
    console.log(`Created: ${yamlFilePath}`);
  }
}

async function fetchAllData() {
  deleteFolders(['datasources', 'components', 'design', 'functions', 'pages', 'project']);

  try {
   
    const response = await axios.post(`${BASE_URL}/api/v1/project/syncProjectDataForGithub`, { branchId }, 
      {
      headers: { projectId:projectId,
        "x-digia-github-token":token }
    }
  );
  console.log(response.data.data.response)

    const { datasources, components, functions, pages, project, typoGraphy, themeData, envs } = response.data.data.response;
  
   
    processAndSaveData('datasources', 'rest', datasources);
    processAndSaveData('datasources', 'environment', envs);
    processAndSaveData('components', '', components);
    processAndSaveData('functions', '', functions);
    processAndSaveData('pages', '', pages);
    processAndSaveData('project', '', project);
    processAndSaveData('design', 'font-tokens', typoGraphy);
    processAndSaveData('design', 'color-tokens', themeData);
    

    console.log(`Data for project ID ${projectId} has been fetched and saved.`);
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
  }
}

// Start the process
fetchAllData();
