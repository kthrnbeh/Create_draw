function illustration(content) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fffdf9"/>${content}</svg>`;
}
function guides(content) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><g fill="none" stroke="#e27763" stroke-width="2.5" stroke-dasharray="7 6" opacity=".8">${content}</g></svg>`;
}
export const STARTER_LESSONS = [
    {
        id: "flower",
        title: "Simple Flower",
        sourceSvg: illustration(`<path d="M200 156C202 196 194 228 198 272" fill="none" stroke="#4e8d64" stroke-width="12" stroke-linecap="round"/><path d="M197 218c-44-31-59-12-47 8 13 19 34 8 47-8Zm4 20c36-35 55-16 42 3-12 18-31 13-42-3Z" fill="#70aa72" stroke="#4e8d64" stroke-width="4"/><g fill="#e98683" stroke="#c9636c" stroke-width="4"><ellipse cx="200" cy="93" rx="28" ry="47"/><ellipse cx="200" cy="93" rx="28" ry="47" transform="rotate(60 200 118)"/><ellipse cx="200" cy="93" rx="28" ry="47" transform="rotate(120 200 118)"/></g><circle cx="200" cy="118" r="28" fill="#f3c766" stroke="#d99c44" stroke-width="4"/>`),
        constructionSvg: guides(`<circle cx="200" cy="118" r="28"/><circle cx="200" cy="118" r="72"/><path d="M200 145v127m-3-54c-24-19-39-15-47-2m49 20c22-21 39-17 46-5"/>`),
        constructionHint: "Try a circle for the center, ovals around it, and two long lines for the stem.",
    },
    {
        id: "house",
        title: "Cozy House",
        sourceSvg: illustration(`<path d="M93 133 200 48l107 85v126H93Z" fill="#e8bd83" stroke="#765c4b" stroke-width="7" stroke-linejoin="round"/><path d="m76 139 124-99 124 99-17 20-107-85-107 85Z" fill="#d77d67" stroke="#765c4b" stroke-width="7" stroke-linejoin="round"/><rect x="166" y="178" width="65" height="81" rx="4" fill="#8f6e5c" stroke="#765c4b" stroke-width="5"/><rect x="113" y="157" width="40" height="40" fill="#b9d8dc" stroke="#765c4b" stroke-width="5"/><path d="M133 158v38m-19-19h39" stroke="#765c4b" stroke-width="4"/><rect x="252" y="157" width="40" height="40" fill="#b9d8dc" stroke="#765c4b" stroke-width="5"/><path d="M272 158v38m-19-19h39" stroke="#765c4b" stroke-width="4"/>`),
        constructionSvg: guides(`<rect x="94" y="132" width="212" height="128"/><path d="m76 140 124-99 124 99M200 42v218M94 132 200 82l106 50"/>`),
        constructionHint: "Block in the house with a rectangle, then add a large triangle for the roof.",
    },
    {
        id: "cat",
        title: "Curious Cat",
        sourceSvg: illustration(`<path d="M111 177c-30 4-42 30-28 48 11 14 29 9 36-2" fill="none" stroke="#d89467" stroke-width="12" stroke-linecap="round"/><ellipse cx="200" cy="211" rx="72" ry="53" fill="#e8b183" stroke="#8c6752" stroke-width="6"/><path d="m139 103 13-59 45 38 51-38 13 59v48c0 39-27 65-62 65s-62-26-62-65Z" fill="#e8b183" stroke="#8c6752" stroke-width="6" stroke-linejoin="round"/><path d="m157 98 7-32 25 22m26 0 28-22 8 32" fill="#d47c83" stroke="#8c6752" stroke-width="4"/><ellipse cx="177" cy="131" rx="6" ry="9" fill="#3c4441"/><ellipse cx="224" cy="131" rx="6" ry="9" fill="#3c4441"/><path d="m194 151 7 6 7-6m-7 6v11m0 0c-10 10-19 8-24 2m24-2c10 10 19 8 24 2m-42-5-26-5m25 14-26 4m68-13 26-5m-25 14 26 4" fill="none" stroke="#805e4e" stroke-width="3" stroke-linecap="round"/>`),
        constructionSvg: guides(`<ellipse cx="200" cy="211" rx="72" ry="53"/><circle cx="201" cy="133" r="63"/><path d="m139 103 13-59 45 38 51-38 13 59M138 151h126M200 70v145"/>`),
        constructionHint: "Use one large circle for the head and an oval for the body before adding ears.",
    },
    {
        id: "butterfly",
        title: "Bright Butterfly",
        sourceSvg: illustration(`<path d="M196 151C147 70 70 68 87 132c-41 0-23 70 22 70-6 54 62 55 88-10m7-41c49-81 126-83 109-19 41 0 23 70-22 70 6 54-62 55-88-10" fill="#9bb6df" stroke="#5d648d" stroke-width="6"/><path d="M200 126c-16 30-17 81 0 111 17-30 16-81 0-111Z" fill="#e98683" stroke="#5d648d" stroke-width="5"/><path d="M196 129c-23-32-37-35-43-42m47 42c23-32 37-35 43-42" fill="none" stroke="#5d648d" stroke-width="5" stroke-linecap="round"/><circle cx="137" cy="139" r="12" fill="#f3c766"/><circle cx="259" cy="139" r="12" fill="#f3c766"/>`),
        constructionSvg: guides(`<path d="M200 116v126M200 158c-48-92-140-89-120-12-43 8-23 74 28 68-7 46 58 51 92-10m0-46c48-92 140-89 120-12 43 8 23 74-28 68 7 46-58 51-92-10M155 88l42 48m48-48-42 48"/>`),
        constructionHint: "Build each side from a big upper oval and a smaller lower curve around a centerline.",
    },
    {
        id: "tree",
        title: "Friendly Tree",
        sourceSvg: illustration(`<path d="M173 166h54l12 107H161Z" fill="#a96f4f" stroke="#765744" stroke-width="6"/><circle cx="150" cy="129" r="56" fill="#79a978" stroke="#4f7758" stroke-width="6"/><circle cx="218" cy="105" r="65" fill="#8cb981" stroke="#4f7758" stroke-width="6"/><circle cx="263" cy="146" r="48" fill="#6fa16f" stroke="#4f7758" stroke-width="6"/><circle cx="177" cy="105" r="8" fill="#f1cf7c"/><circle cx="234" cy="133" r="7" fill="#e98683"/><path d="M188 200v50m21-49v47" stroke="#80553f" stroke-width="5" stroke-linecap="round"/>`),
        constructionSvg: guides(`<rect x="162" y="165" width="76" height="108"/><circle cx="150" cy="129" r="56"/><circle cx="218" cy="105" r="65"/><circle cx="263" cy="146" r="48"/><path d="M200 43v230m-92-145h181"/>`),
        constructionHint: "Group a few overlapping circles for the leafy top and use a rectangle for the trunk.",
    },
    {
        id: "rocket",
        title: "Little Rocket",
        sourceSvg: illustration(`<path d="M200 40c56 53 60 136 0 189-60-53-56-136 0-189Z" fill="#e4a957" stroke="#825f4b" stroke-width="6"/><path d="M154 156 112 203l52-10m82-37 42 47-52-10" fill="#e98683" stroke="#825f4b" stroke-width="6" stroke-linejoin="round"/><circle cx="200" cy="122" r="23" fill="#b9d8dc" stroke="#825f4b" stroke-width="6"/><path d="M177 224c-5 25 6 37 23 50 17-13 28-25 23-50-14 10-32 10-46 0Z" fill="#e98683" stroke="#825f4b" stroke-width="5"/><path d="M200 236v22" stroke="#f3c766" stroke-width="8" stroke-linecap="round"/>`),
        constructionSvg: guides(`<path d="M200 40c56 53 60 136 0 189-60-53-56-136 0-189Z"/><circle cx="200" cy="122" r="23"/><path d="m154 156-42 47 52-10m82-37 42 47-52-10M177 224c-5 25 6 37 23 50 17-13 28-25 23-50"/>`),
        constructionHint: "Start with a long oval, add a circle for the window, and sketch the side fins as triangles.",
    },
];
export function getStarterLesson(id) {
    return STARTER_LESSONS.find((lesson) => lesson.id === id);
}
export function genericConstructionGuide() {
    return guides(`<rect x="83" y="38" width="234" height="224"/><path d="M200 38v224M83 150h234M110 65h180v170H110Z"/>`);
}
