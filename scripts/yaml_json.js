const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const projectId = "66bb5a4a8ece7b451df87b74";

if (!projectId) {
  console.error('Please provide a projectId.');
  process.exit(1);
}

// Function to update data from YAML files to API
async function updateDataFromYamlFiles(folderPath, updateEndpoint) {
  try {
    const data =folderPath.split('/')
    const length = data.length
    const folderName = data[length - 1]
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      if(folderName==="functions") 
      {
        let strJsData
        const nestedFolderPaths = `${folderPath}/${file}`
        const nestedFiles = fs.readdirSync(nestedFolderPaths);
        for (const nestedFile of nestedFiles) {
          const nestedFilePath = path.join(nestedFolderPaths, nestedFile);
          if (path.extname(nestedFile) === '.js') {
            jsData = fs.readFileSync(nestedFilePath, 'utf8');
           strJsData = jsData
          }
          if(path.extname(nestedFile)==='.yaml')
          {
            const yamlData = fs.readFileSync(nestedFilePath, 'utf8');
            let jsonData = yaml.load(yamlData);
            jsonData.functionRawString = strJsData
            console.log(jsonData)
            await axios.post(`${BASE_URL}${updateEndpoint}`, {
              ...jsonData
            }, {
              headers: { projectId }
            });
          }
        }
        return

          }    
      if (path.extname(file) === '.yaml') {
      const yamlData = fs.readFileSync(filePath, 'utf8');
      const jsonData = yaml.load(yamlData);
      console.log(jsonData);
      let id = jsonData.id;
  
      if (folderName === "project") {
        id = jsonData.projectId;
        await axios.post(`${BASE_URL}${updateEndpoint}`, {
          id: id,
          update: jsonData
        }, {
          headers: { projectId }
        });
      } else if (folderName === "design") {
        let assetType = "TYPOGRAPHY";
        if (jsonData.THEME) {
          assetType = "THEME";
        }
  
        await axios.post(`${BASE_URL}${updateEndpoint}`, {
          assetType: assetType,
          assetData: jsonData
        }, {
          headers: { projectId }
        });
      } 
       else  {
        await axios.post(`${BASE_URL}${updateEndpoint}`, {
          id: id,
          update: jsonData
        }, {
          headers: { projectId }
        });
        console.log(`Updated data for ${file} via ${updateEndpoint}`);
      }
    }
  }
  } catch (error) {
    console.error(`Error updating data from YAML files: ${error}`);
  }
}

// Main function to orchestrate updating multiple directories to API
async function updateMultipleAPIs() {
  const apiUpdateConfigs = [
    {
      folderPath: path.join(__dirname, '..', 'datasources', 'rest'),
      updateEndpoint: '/api/v1/datasources/update'
    },
    {
      folderPath: path.join(__dirname, '..', 'datasources', 'environment'),
      updateEndpoint: '/api/v1/environment/update'
    },
    {
      folderPath: path.join(__dirname, '..', 'pages'),
      updateEndpoint: '/api/v1/page/update'
    },
    {
      folderPath: path.join(__dirname, '..', 'components'),
      updateEndpoint: '/api/v1/component/update'
    },
    {
      folderPath: path.join(__dirname, '..', 'design'),
      updateEndpoint: '/api/v1/artbooks/update'
    },
    {
      folderPath: path.join(__dirname, '..', 'functions'),
      updateEndpoint: '/api/v1/functions/update'
    },
    {
      folderPath: path.join(__dirname, '..', 'project'),
      updateEndpoint: '/api/v1/project/update'
    }
  ];

  for (const config of apiUpdateConfigs) {
    console.log(`Updating files in ${config.folderPath}`);
    await updateDataFromYamlFiles(config.folderPath, config.updateEndpoint);
  }

  console.log(`All YAML files have been read, converted to JSON, and updated via API.`);
}

updateMultipleAPIs();
