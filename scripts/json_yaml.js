const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const BASE_URL = 'https://5eeb-2409-40d2-1013-9bda-c5d5-fbb5-4690-9304.ngrok-free.app';
// const BASE_URL = 'http://localhost:3000';

const projectId = "66bb5a4a8ece7b451df87b74";

if (!projectId) {
  console.error('Please provide a projectId.');
  process.exit(1);
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
      if(parentFolderName="functions")
      {
        // jsonData.map(item=>
        // )
      }
      jsonData.forEach((item, index) => {
        const yamlData = yaml.dump(item);
        const yamlFilePath = path.join(dirPath, `${folderName}${index + 1}.yaml`);
        fs.writeFileSync(yamlFilePath, yamlData);
        console.log(`Created ${yamlFilePath}`);
      });
    } else {
      // If jsonData is a single object, process it as a single file
      const yamlData = yaml.dump(jsonData);
      console.log(jsonData)
      if(parentFolderName=="design"&&jsonData.TYPOGRAPHY)
      {
       folderName= 'font-tokens'

      }
      if(parentFolderName=="design"&&jsonData.THEME)
        {
         folderName= 'color-tokens'
  
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
  const apiConfigs = [
    {
      endpoint: '/api/v1/datasources/project',
      folderName: 'rest',
      parentFolderName: 'datasources',
      body: {}
    },
    {
      endpoint: '/api/v1/environment/getAll',
      folderName: 'environment',
      parentFolderName: 'datasources',
      body: {}
    },
    {
      endpoint: '/api/v1/page/getAll',
      folderName: '',
      parentFolderName: 'pages',
      body: {}
    },
    {
      endpoint: '/api/v1/component/getAll',
      folderName: '',
      parentFolderName: 'components',
      body: {}
    },
    {
      endpoint: '/api/v1/artbooks/getArtbookDetails',
      folderName: '',
      parentFolderName: 'design',
      body: {
        input: ["TYPOGRAPHY"]
      }
    },
    {
      endpoint: '/api/v1/artbooks/getArtbookDetails',
      folderName: '',
      parentFolderName: 'design',
      body: {
        input: ["THEME"]
      }
    },
    {
      endpoint: '/api/v1/functions/getAll',
      folderName: '',
      parentFolderName: 'functions',
      body: {
      }
    }
  ];

  for (const apiConfig of apiConfigs) {
    await fetchDataFromApi(apiConfig);
  }

  console.log(`Data for project ID ${projectId} has been fetched and converted to individual YAML files.`);
}

// Start the process
fetchMultipleAPIs();
