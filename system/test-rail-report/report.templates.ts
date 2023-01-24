import * as fs from 'fs';
import { getRandomString } from 'sat-utils';
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
  const internals = Object.keys(dataSet).map(label => {
    return `{
        label: '${label}',
        data: [${dataDescriptors.map(month => dataSet[label][month] || 0).join(',')}],
        borderWidth: 1,
      }`;
  });

  const ctxVarName = getRandomString(10, { letters: true });
  const reportData = `
       <div></div>
       <div></div>
       <canvas id="${reportId}"></canvas>

       <script>
       const ${ctxVarName} = document.getElementById("${reportId}");

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
    `;

  const currentReport = fs.readFileSync(generalReportPath, { encoding: 'utf8' });
  const extendedReport = currentReport.replace('<body>', `<body>\n${reportData}`);

  fs.writeFileSync(generalReportPath, extendedReport);
}

export { createExecutionReport, extendGeneralReport };
