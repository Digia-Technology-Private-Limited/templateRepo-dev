const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const BASE_URL = 'https://1092-2401-4900-1c0a-4131-75c7-4f8a-aec0-6926.ngrok-free.app';
let globalProjectId = null; // Global variable for projectId


// Function to update data from YAML files to API
async function updateDataFromYamlFiles(folderPath, updateEndpoint) {
  try {
    const folderName = path.basename(folderPath);
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      if (folderName === "functions") {
        let jsCode;
        const nestedFolderPaths = path.join(folderPath, file);
        const nestedFiles = fs.readdirSync(nestedFolderPaths);

        for (const nestedFile of nestedFiles) {
          const nestedFilePath = path.join(nestedFolderPaths, nestedFile);

          if (path.extname(nestedFile) === '.js') {
            jsCode = fs.readFileSync(nestedFilePath, 'utf8');
          }

          if (path.extname(nestedFile) === '.yaml') {
            const yamlData = fs.readFileSync(nestedFilePath, 'utf8');
            const jsonData = yaml.load(yamlData);
            const { _id, ...dataWithoutId } = jsonData;
            dataWithoutId.functionRawString = jsCode;

            await axios.post(`${BASE_URL}${updateEndpoint}`, {
              ...dataWithoutId,
            }, {
              headers: { projectId: globalProjectId }
            });
          }
        }
        return;
      }

      if (path.extname(file) === '.yaml') {
        const yamlData = fs.readFileSync(filePath, 'utf8');
        const jsonData = yaml.load(yamlData);

        if (folderName === "project") {
          globalProjectId = jsonData.projectId; 
          await axios.post(`${BASE_URL}${updateEndpoint}`, {
            id: jsonData.projectId,
            update: jsonData,
          }, {
            headers: { projectId: globalProjectId }
          });
        } else if (folderName === "design") {
          const assetType = jsonData.THEME ? "THEME" : "TYPOGRAPHY";
          const data = jsonData[assetType];
          const { branch, ...rest } = data || {};
          await axios.post(`${BASE_URL}${updateEndpoint}`, {
            assetType,
            assetData: jsonData,
            branch:branch
          }, {
            headers: { projectId: globalProjectId }
          });
        } else {
          await axios.post(`${BASE_URL}${updateEndpoint}`, {
            id: jsonData.id,
            update: jsonData,
          }, {
            headers: { projectId: globalProjectId || jsonData.projectId }
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error updating data from YAML files: ${error.message}`);
  }
}

// Main function to orchestrate updating multiple directories to API
async function updateMultipleAPIs() {
  const apiUpdateConfigs = [
    {
      folderPath: path.join(__dirname, '..', 'project'),
      updateEndpoint: '/api/v1/project/update',
    },
    {
      folderPath: path.join(__dirname, '..', 'datasources', 'rest'),
      updateEndpoint: '/api/v1/datasources/update',
    },
    {
      folderPath: path.join(__dirname, '..', 'datasources', 'environment'),
      updateEndpoint: '/api/v1/environment/update',
    },
    {
      folderPath: path.join(__dirname, '..', 'pages'),
      updateEndpoint: '/api/v1/page/update',
    },
    {
      folderPath: path.join(__dirname, '..', 'components'),
      updateEndpoint: '/api/v1/component/update',
    },
    {
      folderPath: path.join(__dirname, '..', 'design'),
      updateEndpoint: '/api/v1/artbooks/update',
    },
    {
      folderPath: path.join(__dirname, '..', 'functions'),
      updateEndpoint: '/api/v1/functions/update',
    },
  ];

  for (const config of apiUpdateConfigs) {
    console.log(`Updating files in ${config.folderPath}`);
    await updateDataFromYamlFiles(config.folderPath, config.updateEndpoint);
  }

  console.log(`All YAML files have been read, converted to JSON, and updated via API.`);
}

updateMultipleAPIs();
