const fs = require('fs');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const docx = require('docx');

const samplesDir = './public/samples';

if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// 1. Generate CSV
const csvData = `email,firstName,lastName,companyName,title
john.doe@example.com,John,Doe,Acme Corp,CEO
jane.smith@test.com,Jane,Smith,Tech Innovators,CTO
robert.jones@demo.org,Robert,Jones,Global Sales,VP of Sales
`;
fs.writeFileSync(`${samplesDir}/sample.csv`, csvData);
console.log('Created sample.csv');

// 2. Generate Excel (.xlsx)
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet([
  { email: "sarah.connor@cyberdyne.com", firstName: "Sarah", lastName: "Connor", companyName: "Cyberdyne", title: "Security" },
  { email: "michael.scott@dundermifflin.com", firstName: "Michael", lastName: "Scott", companyName: "Dunder Mifflin", title: "Regional Manager" },
  { email: "jim.halpert@dundermifflin.com", firstName: "Jim", lastName: "Halpert", companyName: "Dunder Mifflin", title: "Sales Rep" }
]);
xlsx.utils.book_append_sheet(wb, ws, "Leads");
xlsx.writeFile(wb, `${samplesDir}/sample.xlsx`);
console.log('Created sample.xlsx');

// 3. Generate PDF (.pdf)
const pdfDoc = new PDFDocument();
pdfDoc.pipe(fs.createWriteStream(`${samplesDir}/sample.pdf`));
pdfDoc.fontSize(16).text('Lead Export Document', { align: 'center' });
pdfDoc.moveDown();
pdfDoc.fontSize(12).text('Below is a list of acquired leads and their contact information:');
pdfDoc.moveDown();
pdfDoc.text('1. Alice Anderson - alice.anderson@example.org (Director of Marketing)');
pdfDoc.text('2. Bob Builder - builder.bob@construction.co (Project Manager)');
pdfDoc.text('3. Charlie Chaplin - charlie@silentfilms.net (Actor)');
pdfDoc.end();
console.log('Created sample.pdf');

// 4. Generate Word (.docx)
const doc = new docx.Document({
  creator: "PrimeInbox",
  title: "Sample Leads",
  description: "A sample document containing lead emails",
  sections: [
    {
      properties: {},
      children: [
        new docx.Paragraph({
          text: "Lead Contact Information",
          heading: docx.HeadingLevel.HEADING_1,
        }),
        new docx.Paragraph({
          text: "This document contains unstructured lead data. The system will automatically extract the email addresses.",
        }),
        new docx.Paragraph({ text: "Name: David Patel" }),
        new docx.Paragraph({ text: "Email: david.patel@startup.io" }),
        new docx.Paragraph({ text: "" }),
        new docx.Paragraph({ text: "Name: Emma Watson" }),
        new docx.Paragraph({ text: "Email: emma.w@magic.com" }),
      ],
    },
  ],
});

docx.Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(`${samplesDir}/sample.docx`, buffer);
  console.log('Created sample.docx');
});
