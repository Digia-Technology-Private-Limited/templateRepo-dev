const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const BASE_URL = 'https://f70c-2401-4900-8856-a0f3-60d1-8e58-590d-768d.ngrok-free.app';
// const BASE_URL = 'http://localhost:3000';
let projectId;
async function collectDataFromYamlFiles(folderPath, folderName) {
  const dataCollection = [];

  const traverseFolder = (currentPath) => {
    if (!fs.existsSync(currentPath)) {
      console.warn(`Warning: Folder not found - ${currentPath}`);
      return; // Skip processing if the folder doesn't exist
    }

    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);

      try {
        if (fs.lstatSync(filePath).isDirectory()) {
          traverseFolder(filePath);
        } else if (path.extname(file) === '.yaml') {
          const yamlData = fs.readFileSync(filePath, 'utf8');
          const jsonData = yaml.load(yamlData);
          if(jsonData.projectId)
          {
            projectId = jsonData.projectId;
          }

          if (folderName === "functions" && filePath.includes(".js")) {
            const jsFilePath = filePath.replace('.yaml', '.js');
            if (fs.existsSync(jsFilePath)) {
              jsonData.functionRawString = fs.readFileSync(jsFilePath, 'utf8');
            }
          }

          dataCollection.push(jsonData);
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}: ${error.message}`);
      }
    }
  };

  traverseFolder(folderPath);

  return dataCollection;
}

async function collectAllData() {
  const folderConfigs = [
    { folderPath: path.join(__dirname, '..', 'project'), folderName: 'project' },
    { folderPath: path.join(__dirname, '..', 'datasources', 'rest'), folderName: 'datasources' },
    { folderPath: path.join(__dirname, '..', 'datasources', 'environment'), folderName: 'environment' },
    { folderPath: path.join(__dirname, '..', 'pages'), folderName: 'pages' },
    { folderPath: path.join(__dirname, '..', 'components'), folderName: 'components' },
    { folderPath: path.join(__dirname, '..', 'design'), folderName: 'design' },
    { folderPath: path.join(__dirname, '..', 'functions'), folderName: 'functions' },
  ];

  const allData = {};

  for (const config of folderConfigs) {
    console.log(`Collecting data from ${config.folderPath}`);
    allData[config.folderName] = await collectDataFromYamlFiles(config.folderPath, config.folderName);
  }

  return allData;
}

async function updateAllDataToBackend() {
  const allData = await collectAllData();

  try {
    const token = process.env.DIGIA_TOKEN;
    const response = await axios.post(`${BASE_URL}/api/v1/project/updateProjectDataForGithub`, {
      data: allData,
    }, {
      headers: {
        projectid:projectId,
        "x-digia-github-token": token,
      },
    });
    console.log(`All data updated successfully:`, response.data);
  } catch (error) {
    console.error(`Error updating data to backend: ${error.message}`);
  }
}

updateAllDataToBackend();
