import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cleanContent =
  '<h1 style="text-align: center"><b><i><u>Uopeople CS</u></i></b></h1>' +
  '<ol>' +
  '<li>Duration- <b>18</b> Months' +
  '<ul style="list-style-type: disclosure-closed">' +
  '<li>1st Term - 2 Course - 03/09/2026 to 01/11/2026</li>' +
  '<li>2nd - 8th Term - 27 Course - 03/11/2026 to 30/12/2027</li>' +
  '<li>Another 11 Course From Sophia Learning</li>' +
  '</ul>' +
  '</li>' +
  '</ol>';

await prisma.sectionItem.update({
  where: { id: "cmvgshc8x0001xm0c54iawyoh" },
  data: { content: cleanContent },
});

console.log("Successfully updated item cmvgshc8x0001xm0c54iawyoh");
process.exit(0);
