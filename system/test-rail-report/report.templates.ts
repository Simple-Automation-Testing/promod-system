import * as fs from 'fs';
import { getRandomString, prettifyCamelCase } from 'sat-utils';
import { testRunsWithExecutionReportHTML, generalReportPath } from './constants';

function createGeneralReportTemplate() {
  const generalReportTemplate = `
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QA report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js" integrity="sha384-w76AqPfDkMBDXo30jS1Sgez6pr3x5MlQ1ZAGC+nuZB+EYdgRZgiwxhTBTkF7CXvN" crossorigin="anonymous"></script>
  </head>
  <body>
    <div></div>
  </body>
</html>
`;

  fs.writeFileSync(generalReportPath, generalReportTemplate);
}

function templateExecution(dataDescriptors: string[], dataSet: { [k: string]: { [k: string]: number } }) {
  const ctxVarName = getRandomString(10, { letters: true });
  const internals = Object.keys(dataSet).map(label => {
    return `{
      label: '${label}',
      data: [${dataDescriptors.map(month => dataSet[label][month] || 0).join(',')}],
      borderWidth: 1,
    }`;
  });

  return `
      <canvas id="report"></canvas>

     <script>
      const ${ctxVarName} = document.getElementById('report');

      new Chart(${ctxVarName}, {
        type: 'bar',
        data: {
          labels: [${dataDescriptors.map(item => `"${item.toString()}"`).join(',')}],
          datasets: [
            ${internals.join(',')}
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    </script>
  </body>
</html>`;
}

function createExecutionReport(fileId: string, dataDescriptors, dataSet) {
  const htmlData = templateExecution(dataDescriptors, dataSet);

  const filePath = testRunsWithExecutionReportHTML(fileId);

  fs.writeFileSync(filePath, htmlData);
}

function extendGeneralReport({
  reportId,
  dataDescriptors,
  dataSet,
}: {
  reportId: string;
  dataDescriptors: string[];
  dataSet: { [k: string]: { [k: string]: number } };
}) {
  if (!fs.existsSync(generalReportPath)) {
    createGeneralReportTemplate();
  }

  const ctxVarName = getRandomString(15, { letters: true });
  const reportData = `
       <h2 class="col-5" onclick="showHide${reportId}Block()">${reportId.replace(/\_/gi, ' ')}</h2>
       <div id="${reportId}_block">
        <div class="container">

        <div class="row">
          <div class="dropdown col-4 align-self-start from ${reportId}">
            <button
              class="btn btn-secondary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style="width: 100%"
            >From</button>

            <ul class="dropdown-menu from ${reportId}"></ul>
          </div>

          <div class="dropdown col-4 align-self-start to ${reportId}">
            <button
              class="btn btn-secondary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style="width: 100%"
            >To</button>

            <ul class="dropdown-menu to ${reportId}"></ul>
          </div>
        </div>
        </div>
        <canvas id="${reportId}"></canvas>
       </div>

       <script>

      function showHide${reportId}Block () {
        const blockElement = document.querySelector('#${reportId}_block');
        if (blockElement.style.display === 'none') {
          blockElement.style.display = ''
        } else {
          blockElement.style.display = 'none'
        }
      }

       let canvasHolder${reportId};
       const ${ctxVarName}ID = '${reportId}';

       const ${ctxVarName} = document.getElementById(${ctxVarName}ID);

      addFilterOptions${reportId}();
      renderChart${reportId}();

      function filterFrom${reportId}(event, point) {
        console.log(point);
        if (point === 'from') {
          const fromDropPoint = document.querySelector('.dropdown.col-4.align-self-start.from.${reportId} button',);

          fromDropPoint.innerText = \`From: \${event.target.innerText}\`;

          renderChart${reportId}(event.target.innerText, null);
        } else {
          const toDropPoint = document.querySelector('.dropdown.col-4.align-self-start.to.${reportId} button');
          toDropPoint.innerText = \`To: \${event.target.innerText}\`;

          renderChart${reportId}(null, event.target.innerText);
        }
      }

       function addFilterOptions${reportId}() {
         const options = ${JSON.stringify(dataDescriptors)};

         const firstPoint = options[0];
         const lastPoint = options[options.length - 1];

         const fromDropPoint = document.querySelector('.dropdown.col-4.align-self-start.from.${reportId} button');
         const toDropPoint = document.querySelector('.dropdown.col-4.align-self-start.to.${reportId} button');

         fromDropPoint.innerText = \`\${fromDropPoint.innerText}: \${firstPoint}\`;
         toDropPoint.innerText = \`\${toDropPoint.innerText}: \${lastPoint}\`;

         const fromOpts = options.map(
           month =>
             \`<li><a class="dropdown-item" onclick="filterFrom${reportId}(event, 'from')">${`\${month}`}</a></li>\`,
         );

         document.querySelector(\`.dropdown-menu.from.${reportId}\`).innerHTML = fromOpts.join('\\n');

         const toOpts = options.map(
           month => \`<li><a class="dropdown-item" onclick="filterFrom${reportId}(event, 'to')">\${month}</a></li>\`,
         );

         document.querySelector(\`.dropdown-menu.to.${reportId}\`).innerHTML = toOpts.join('\\n');
      }

      function renderChart${reportId}(from, to) {
        const dataSet = ${JSON.stringify(dataSet)};

        let internals;
        let dataDescriptors = ${JSON.stringify(dataDescriptors)};

        const fromDropPoint = document.querySelector('.dropdown.col-4.align-self-start.from.${reportId} button');
        const toDropPoint = document.querySelector('.dropdown.col-4.align-self-start.to.${reportId} button');

        if(canvasHolder${reportId}) {
          canvasHolder${reportId}.destroy()
        }

        if(!from && !to) {
          dataDescriptors = ${JSON.stringify(dataDescriptors)};
          internals = Object.keys(dataSet).map(label => {
            return {
              label: label,
              data: dataDescriptors.map(month => dataSet[label][month] || 0),
              borderWidth: 1,
            };
          });
        } else if (from) {
          const toDropPoint = document.querySelector('.dropdown.col-4.align-self-start.to.${reportId} button');
          const to = toDropPoint.innerText.replace('To:', '').trim()
          const fromIndex = ${JSON.stringify(dataDescriptors)}.findIndex(item => item === from);
          const toIndex = ${JSON.stringify(dataDescriptors)}.findIndex(item => item === to);

          dataDescriptors = Array.from(${JSON.stringify(dataDescriptors)}).slice(fromIndex, toIndex + 1);

          internals = Object.keys(dataSet).map(label => {
            return {
              label: label,
              data: dataDescriptors.map(month => dataSet[label][month] || 0),
              borderWidth: 1,
            };
          });
        } else if(to) {
          const fromDropPoint = document.querySelector('.dropdown.col-4.align-self-start.from.${reportId} button');
          const from = fromDropPoint.innerText.replace('From:', '').trim()
          const fromIndex = ${JSON.stringify(dataDescriptors)}.findIndex(item => item === from);
          const toIndex = ${JSON.stringify(dataDescriptors)}.findIndex(item => item === to);

          dataDescriptors = Array.from(${JSON.stringify(dataDescriptors)}).slice(fromIndex, toIndex + 1);

          internals = Object.keys(dataSet).map(label => {
            return {
              label: label,
              data: dataDescriptors.map(month => dataSet[label][month] || 0),
              borderWidth: 1,
            };
          });
        }

        canvasHolder${reportId} = new Chart(${ctxVarName}, {
          type: 'bar',
          data: {
            labels: dataDescriptors.map(item => item.toString()),
            datasets: internals,
          },
          options: {
            scales: {
              y: {beginAtZero: true},
            },
          },
        });
      }
      </script>
    `;

  const currentReport = fs.readFileSync(generalReportPath, { encoding: 'utf8' });
  const extendedReport = currentReport.replace('<body>', `<body>\n${reportData}`);

  fs.writeFileSync(generalReportPath, extendedReport);
}

export { createExecutionReport, extendGeneralReport, createGeneralReportTemplate };
