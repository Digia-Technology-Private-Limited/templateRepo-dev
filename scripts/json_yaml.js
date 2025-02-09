const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const BASE_URL = 'https://5cwiexaxii53.share.zrok.io';

const args = process.argv.slice(2);
const projectId = args[0];
const branchId = args[1];
const token = process.env.DIGIA_TOKEN;




// const projectId = "67a89172224494c9852379d3"
// const branchId = "67a89172224494c9852379d5"
// const token = "?wubr>hlenr^e(`@7_%/qO>>A~EmGs12b4af7b31e305f84eb454b2946086c08012a8e45c49a63855fc7ca9a0976a0b"
// Validate projectId

if (!projectId) {
  console.error('Please provide a projectId.');
  process.exit(1);
}

// function removeIds(obj) {
//   if (Array.isArray(obj)) {
//     return obj.map(removeIds);
//   } else if (obj !== null && typeof obj === 'object') {
//     return Object.keys(obj).reduce((acc, key) => {
//       if (!['id', 'projectId', 'branchId','createdAt','updatedAt',].includes(key)) {
//         acc[key] = removeIds(obj[key]);
//       }
//       return acc;
//     }, {});
//   }
//   return obj;
// }

function removeIds(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (item && typeof(item) === 'object') {
        return filterObj(item)
      }
      return item;
    });
    
  } else if (obj && typeof(obj) === 'object') {
    return  filterObj(obj)
  }
  return obj;
}

function filterObj(item)
{
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => !['id','_id', 'branchId', 'userId','projectId'].includes(key))
  );

}


// Function to delete specific folders
function deleteFolders(folders) {
  folders.forEach((folder) => {
    const dirPath = path.join(__dirname, '..', folder);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Deleted folder: ${dirPath}`);
    }
  });
}

// Function to process and save data based on the structure
function processAndSaveData(parentFolderName, folderName, data, fileName = 'default') {
  const dirPath = path.join(__dirname, '..', parentFolderName, folderName);
  fs.mkdirSync(dirPath, { recursive: true });


  data = removeIds(data); // Remove IDs before saving

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
    const response = await axios.post(
      `${BASE_URL}/api/v1/project/syncProjectDataForGithub`,
      { branchId },
      {
        headers: {
          projectId: projectId,
          "x-digia-github-token": token
        }
      }
    );

    if (!response.data || !response.data.data || !response.data.data.response) {
      console.error('Unexpected response format:', response.data);
      process.exit(1);
    }

    console.log(response.data.data.response);

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
    process.exit(1); 
  }
}


// Start the process
fetchAllData();
