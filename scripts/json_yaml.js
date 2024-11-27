const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const BASE_URL = 'https://d2cd-223-190-81-201.ngrok-free.app';
// const BASE_URL = 'http://localhost:3000';

const args = process.argv.slice(2); // Skip the first two default arguments
const branch = args[1];
const projectId = args[0];

// const branch = "main";

// const projectId = "66c59af1529ef58dc8381385";

// console.log(args);

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

// Function to fetch data from an API and save it as YAML files
async function fetchDataFromApi(apiConfig) {
  let { endpoint, folderName = 'default', parentFolderName, body } = apiConfig;

  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, body, {
      headers: { projectId }
    });

    const jsonData = response.data.data.response;

    const dirPath = path.join(__dirname, '..', parentFolderName, folderName);
    fs.mkdirSync(dirPath, { recursive: true });

    if (Array.isArray(jsonData)) {
      jsonData.forEach((item) => {
        const yamlData = yaml.dump(item);
        if (parentFolderName === "functions") {
          folderName = item.functionName;
          const functionDirPath = path.join(__dirname, '..', parentFolderName, folderName);
          fs.mkdirSync(functionDirPath, { recursive: true });
          const yamlFilePath = path.join(functionDirPath, `${folderName}.yaml`);
          const jsFilePath = path.join(functionDirPath, `${folderName}.js`);
          fs.writeFileSync(yamlFilePath, yamlData);
          fs.writeFileSync(jsFilePath, item.functionRawString);
          return;
        }

        if (item.name) folderName = item.name;
        if (item.displayName) folderName = item.displayName;
        if (item.appDetails) folderName = item.appDetails.displayName;

        const yamlFilePath = path.join(dirPath, `${folderName}.yaml`);
        fs.writeFileSync(yamlFilePath, yamlData);
        console.log(`Created ${yamlFilePath}`);
      });
    } else {
      const yamlData = yaml.dump(jsonData);
      console.log(jsonData)
      if (parentFolderName === "design" && jsonData.TYPOGRAPHY) {
        folderName = 'font-tokens';
      }
      if (parentFolderName === "design" && jsonData.THEME) {
        folderName = 'color-tokens';
      }
      if (parentFolderName === "project") {
        folderName = jsonData.appDetails.displayName;
      }
      const yamlFilePath = path.join(dirPath, `${folderName}.yaml`);
      fs.writeFileSync(yamlFilePath, yamlData);
      console.log(`Created ${yamlFilePath}`);
    }

  } catch (error) {
    console.error(`Error fetching data from ${endpoint}: ${error}`);
  }
}

// Main function to orchestrate fetching data from multiple APIs
async function fetchMultipleAPIs() {
  // Delete specified folders first
  deleteFolders(['datasources', 'components', 'design', 'functions', 'pages', 'project']);

  const apiConfigs = [
    {
      endpoint: '/api/v1/datasources/project',
      folderName: 'rest',
      parentFolderName: 'datasources',
      body: { branch }
    },
    {
      endpoint: '/api/v1/environment/getAll',
      folderName: 'environment',
      parentFolderName: 'datasources',
      body: { branch }
    },
    {
      endpoint: '/api/v1/page/getAll',
      folderName: '',
      parentFolderName: 'pages',
      body: { branch }
    },
    {
      endpoint: '/api/v1/component/getAll',
      folderName: '',
      parentFolderName: 'components',
      body: { branch }
    },
    {
      endpoint: '/api/v1/artbooks/getArtbookDetails',
      folderName: '',
      parentFolderName: 'design',
      body: {
        input: ["TYPOGRAPHY"],
        branch
      }
    },
    {
      endpoint: '/api/v1/artbooks/getArtbookDetails',
      folderName: '',
      parentFolderName: 'design',
      body: {
        input: ["THEME"],
        branch
      }
    },
    {
      endpoint: '/api/v1/functions/getAll',
      folderName: '',
      parentFolderName: 'functions',
      body: { branch }
    },
    {
      endpoint: '/api/v1/project/getById',
      folderName: '',
      parentFolderName: 'project',
    }
  ];

  for (const apiConfig of apiConfigs) {
    await fetchDataFromApi(apiConfig);
  }

  console.log(`Data for project ID ${projectId} has been fetched and converted to individual YAML files.`);
}

// Start the process
fetchMultipleAPIs();
