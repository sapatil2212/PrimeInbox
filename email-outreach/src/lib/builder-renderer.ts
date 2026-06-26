export function renderBlockToHtml(block: any, globalSettings: any): string {
  const type = block.type;

  switch (type) {
    case "heading": {
      const text = block.content?.text || "Heading";
      const level = block.content?.level || "h2";
      const align = block.content?.align || "left";
      const style = block.content?.style || {};
      const fontSize = style.fontSize || "24px";
      const color = style.color || "#111827";
      const fontWeight = style.fontWeight || "800";
      const fontStyle = style.fontStyle || "normal";
      const textDecoration = style.textDecoration || "none";
      const padding = style.padding || "10px 0px";
      return `<div style="text-align: ${align}; padding: ${padding};"><${level} style="font-family: inherit; font-size: ${fontSize}; color: ${color}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; margin: 0; line-height: 1.25;">${text}</${level}></div>`;
    }

    case "text": {
      const text = block.content?.text || "Text paragraph...";
      const align = block.content?.align || "left";
      const style = block.content?.style || {};
      const fontSize = style.fontSize || "15px";
      const color = style.color || "#4b5563";
      const fontWeight = style.fontWeight || "normal";
      const fontStyle = style.fontStyle || "normal";
      const textDecoration = style.textDecoration || "none";
      const padding = style.padding || "10px 0px";
      const lineHeight = style.lineHeight || "1.5";
      return `<div style="text-align: ${align}; padding: ${padding}; font-size: ${fontSize}; color: ${color}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; line-height: ${lineHeight}; white-space: pre-line;">${text}</div>`;
    }

    case "image": {
      const url = block.content?.url || "https://placehold.co/600x300";
      const alt = block.content?.alt || "";
      const align = block.content?.align || "center";
      const rounded = block.content?.rounded || 0;
      const padding = block.content?.padding || "10px 0px";
      const link = block.content?.link || "";
      const width = block.content?.width || "100%";
      let imgMarkup = `<img src="${url}" alt="${alt}" style="display: inline-block; width: ${width}; max-width: 100%; border-radius: ${rounded}px; border: 0;" />`;
      if (link) {
        imgMarkup = `<a href="${link}" target="_blank">${imgMarkup}</a>`;
      }
      return `<div style="text-align: ${align}; padding: ${padding};">${imgMarkup}</div>`;
    }

    case "button": {
      const text = block.content?.text || "Click Me";
      const url = block.content?.url || "#";
      const align = block.content?.align || "left";
      const style = block.content?.style || {};
      const bgColor = style.backgroundColor || "#4f46e5";
      const textColor = style.textColor || "#ffffff";
      const borderRadius = style.borderRadius || 6;
      const padding = style.padding || "12px 24px";
      const isFull = style.width === "full";
      return `
        <div style="text-align: ${align}; padding: 10px 0px;">
          <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="display: inline-block; ${isFull ? "width: 100%;" : ""}">
            <tr>
              <td align="center" bgcolor="${bgColor}" style="border-radius: ${borderRadius}px;">
                <a href="${url}" target="_blank" style="display: inline-block; padding: ${padding}; font-family: inherit; font-size: 14px; font-weight: bold; color: ${textColor}; text-decoration: none; border-radius: ${borderRadius}px; text-align: center; ${isFull ? "display: block; width: 100%; box-sizing: border-box;" : ""}">
                  ${text}
                </a>
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    case "divider": {
      const color = block.content?.color || "#e5e7eb";
      const height = block.content?.height || 1;
      const padding = block.content?.padding || "15px 0px";
      return `<div style="padding: ${padding};"><hr style="border: 0; border-top: ${height}px solid ${color}; margin: 0;" /></div>`;
    }

    case "spacer": {
      const height = block.content?.height || 20;
      return `<div style="height: ${height}px; line-height: ${height}px; font-size: 0px;">&nbsp;</div>`;
    }

    case "logo": {
      const url = block.content?.url || "https://placehold.co/150x50";
      const alt = block.content?.alt || "Logo";
      const align = block.content?.align || "center";
      const link = block.content?.link || "#";
      const height = block.content?.height || "40";
      const imgStyle = `border: 0; height: ${height}px; display: inline-block; max-width: 100%; width: auto; vertical-align: middle;`;
      let imgMarkup = `<img src="${url}" alt="${alt}" height="${height}" style="${imgStyle}" />`;
      if (link) {
        imgMarkup = `<a href="${link}" target="_blank" style="display: inline-block; text-decoration: none;">${imgMarkup}</a>`;
      }
      return `
        <div style="text-align: ${align}; padding: 15px 0px;">
          ${imgMarkup}
        </div>
      `;
    }

    case "social": {
      const platforms = block.content?.platforms || [
        { name: "Facebook", url: "#", icon: "https://cdn-icons-png.flaticon.com/512/124/124010.png" },
        { name: "Twitter", url: "#", icon: "https://cdn-icons-png.flaticon.com/512/3256/3256013.png" },
        { name: "LinkedIn", url: "#", icon: "https://cdn-icons-png.flaticon.com/512/174/174857.png" }
      ];
      const align = block.content?.align || "center";
      const size = block.content?.size || "24";
      const listItems = platforms.map((p: any) => `
        <td style="padding: 0 8px;">
          <a href="${p.url}" target="_blank">
            <img src="${p.icon}" alt="${p.name}" width="${size}" height="${size}" style="display: block; width: ${size}px; height: ${size}px; border: 0;" />
          </a>
        </td>
      `).join("");
      return `
        <div style="padding: 15px 0px;">
          <table role="presentation" align="${align}" border="0" cellspacing="0" cellpadding="0" style="display: inline-block;">
            <tr>
              ${listItems}
            </tr>
          </table>
        </div>
      `;
    }

    case "footer": {
      const text = block.content?.text || "© 2548 Company Name. All rights reserved.";
      const unsubText = block.content?.unsubText || "If you don't wish to receive these emails, you can unsubscribe below.";
      const align = block.content?.align || "center";
      return `
        <div style="text-align: ${align}; padding: 20px 0px; font-size: 12px; color: #9ca3af; line-height: 1.5; border-top: 1px solid #e5e7eb; margin-top: 20px;">
          <p style="margin: 0 0 8px 0;">${text}</p>
          <p style="margin: 0;">${unsubText}</p>
          <p style="margin: 8px 0 0 0;"><a href="{{unsubscribe}}" style="color: #4f46e5; text-decoration: underline;">Unsubscribe</a></p>
        </div>
      `;
    }

    case "signature": {
      const name = block.content?.name || "Sender Name";
      const role = block.content?.role || "Founder & CEO";
      const company = block.content?.company || "My Company";
      const photo = block.content?.photo || "";
      const alignment = block.content?.align || "left";

      let photoMarkup = "";
      if (photo) {
        photoMarkup = `
          <td style="padding-right: 12px; vertical-align: middle;">
            <img src="${photo}" alt="${name}" width="50" height="50" style="border-radius: 50%; display: block; border: 0;" />
          </td>
        `;
      }

      return `
        <div style="padding: 15px 0; text-align: ${alignment};">
          <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="display: inline-block; text-align: left;">
            <tr>
              ${photoMarkup}
              <td style="vertical-align: middle;">
                <div style="font-size: 14px; font-weight: bold; color: #111827; margin: 0;">${name}</div>
                <div style="font-size: 12px; color: #4b5563; margin: 2px 0 0 0;">${role} | <span style="font-weight: 600;">${company}</span></div>
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    case "html": {
      return block.content?.code || '<div style="padding: 10px; border: 1px dashed #cccccc; text-align: center;">HTML Block</div>';
    }

    default:
      return "";
  }
}

export function renderDragDropToHtml(data: any): string {
  if (!data) return "";
  const global = data.globalSettings || {};
  const sections = data.sections || [];

  const defaultFont = global.fontFamily || "'Outfit', 'Inter', sans-serif";
  const emailWidth = global.emailWidth || 600;
  const bgMain = global.backgroundColor || "#f4f4f5";
  const bgContent = global.contentBackgroundColor || "#ffffff";

  let bodyContent = "";

  for (const section of sections) {
    const sBg = section.backgroundColor || "transparent";
    const sPadding = section.padding || { top: 0, bottom: 0, left: 0, right: 0 };
    const sMargin = section.margin || { top: 0, bottom: 0 };
    const sBorderRadius = section.borderRadius || 0;
    const sVisibility = section.visibility || "all";
    const sColumns = section.columns || [];

    let classVal = "";
    if (sVisibility === "desktop") classVal = 'class="desktop-only"';
    if (sVisibility === "mobile") classVal = 'class="mobile-only"';

    let colMarkup = "";
    if (sColumns.length > 0) {
      let colWidths = sColumns.map((c: any) => c.width || `${Math.round(100 / sColumns.length)}%`);
      colMarkup += '<tr style="vertical-align: top;">';
      
      sColumns.forEach((col: any, index: number) => {
        let colStyle = `width: ${colWidths[index]}; vertical-align: top; padding: 0 10px;`;
        colMarkup += `<td style="${colStyle}" width="${colWidths[index]}">`;

        const blocks = col.blocks || [];
        for (const block of blocks) {
          colMarkup += renderBlockToHtml(block, global);
        }

        colMarkup += '</td>';
      });
      
      colMarkup += '</tr>';
    }

    bodyContent += `
      <!-- Section Start -->
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" ${classVal} style="background-color: ${sBg}; border-radius: ${sBorderRadius}px; margin-top: ${sMargin.top}px; margin-bottom: ${sMargin.bottom}px; border-collapse: collapse;">
        <tr>
          <td style="padding: ${sPadding.top}px ${sPadding.right}px ${sPadding.bottom}px ${sPadding.left}px;">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              ${colMarkup}
            </table>
          </td>
        </tr>
      </table>
      <!-- Section End -->
    `;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: ${bgMain};
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    table {
      border-collapse: collapse !important;
    }
    @media only screen and (max-width: ${emailWidth}px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .desktop-only {
        display: none !important;
      }
      .mobile-only {
        display: block !important;
        width: 100% !important;
        max-height: none !important;
        overflow: visible !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgMain}; font-family: ${defaultFont};">
  <center>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bgMain}; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <table role="presentation" class="email-container" width="${emailWidth}" border="0" cellspacing="0" cellpadding="0" style="width: ${emailWidth}px; max-width: ${emailWidth}px; background-color: ${bgContent}; text-align: left; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02); border-collapse: collapse;">
            <tr>
              <td style="padding: 20px;">
                ${bodyContent}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;

  return fullHtml;
}
