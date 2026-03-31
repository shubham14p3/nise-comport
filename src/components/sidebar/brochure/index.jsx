import React from "react";
import { getImage } from "../../../data/getImage";

const downloadTextFile = (filename, content) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

const brochurePdfContent = `Ha Ha Ha, Heavy Relax, See You Not For Mind. kew amare chuse kore na not on like. cold baby cold baby, just chill.....
[Motherboard Takla]`;

const brochureDocContent = `Ha Ha Ha, Heavy Relax, See You Not For Mind. kew amare chuse kore na not on like. cold baby cold baby, just chill.....
[Motherboard Takla]`;

const Brochure = () => {
    return (
        <div className="sidbar-menu">
            <ul>
                <li className="m-0">
                    <button
                        type="button"
                        onClick={() => downloadTextFile("Brochure.txt", brochurePdfContent)}
                    >
                        <img
                            src={getImage("service/icon/small/9.png")}
                            alt="brochure pdf icon"
                        />
                        Brochure.PDF
                    </button>
                </li>

                <li className="m-0">
                    <button
                        type="button"
                        className="border-0"
                        onClick={() => downloadTextFile("Brochure.txt", brochureDocContent)}
                    >
                        <img
                            src={getImage("service/icon/small/10.png")}
                            alt="brochure doc icon"
                        />
                        Brochure.DOC
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default Brochure;