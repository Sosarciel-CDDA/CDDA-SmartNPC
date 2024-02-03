import { DataManager } from "cdda-event";
import { createCastAI } from "./CastAI";
import { DATA_PATH, OUT_PATH } from "./SADefine";
import { createMathFunc } from "./MathFunc";
import { utilSpell } from "./UtilSpell";






async function main(){
    const AIDm = new DataManager(DATA_PATH,OUT_PATH,"CNPCAIEF");
    await utilSpell(AIDm);
    await createCastAI(AIDm);
    await createMathFunc(AIDm);
    await AIDm.saveAllData();
}
main();
