const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { json } = require('stream/consumers');

const BASE_URL = 'https://6339-2401-4900-8854-89a0-9908-fb28-366f-5133.ngrok-free.app';
const args = process.argv.slice(2); 
const token = process.env.DIGIA_TOKEN;

let projectId;
let branchName = args[0];



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
          // if(jsonData.projectId)
          // {
          //   projectId = jsonData.projectId;
          // }
          if(folderName=="project" )
          {
            projectId = jsonData.projectId
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
    { folderPath: path.join(__dirname, '..', 'design','font-tokens'), folderName: 'typoGraphy' },
    { folderPath: path.join(__dirname, '..', 'design','color-tokens'), folderName: 'themeData' },
    { folderPath: path.join(__dirname, '..', 'functions'), folderName: 'functions' },
  ];

  const allData = {};

  for (const config of folderConfigs) {
    allData[config.folderName] = await collectDataFromYamlFiles(config.folderPath, config.folderName);
  }

  return allData;
}

async function updateAllDataToBackend() {
  try {
    const createSet = new Set();
    const updateSet = new Set();
    const deleteSet = new Set();
    const allFolderData = await collectAllData();
    // console.log(allFolderData)
    
    

    // Update project data
    const updateResponse = await axios.post(
      `${BASE_URL}/api/v1/project/updateProjectDataForGithub`,
      { data: allFolderData,projectId:projectId,branchName:branchName },
      {
        headers: {
          projectid: projectId,
          "x-digia-github-token": token,
        },
      }
    );
    console.log("All data updated successfully:", updateResponse.data);
  } catch (error) {
    console.error(`Error updating data to backend: ${error.message}`);
  }
}

updateAllDataToBackend();
