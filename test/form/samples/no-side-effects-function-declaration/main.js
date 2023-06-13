<<<<<<< HEAD
import fnDefault, { fnPure, fnEffects, fnA, fnB, fnC, fnD, fnE, fnF, fnAlias, fnFromSub } from './functions'
=======
import fnDefault, { fnPure, fnEffects, fnA, fnB, fnC, fnD, fnE, fnF, fnI, fnG, fnJ, fnK, fnAlias, fnFromSub } from './functions'
>>>>>>> 63b712596b42c471d882b4de058d4647d3b9a55c

const pure = fnPure(1)
const effects = fnEffects(2)

const a = fnA(1)
const b = fnB(2)
const c = fnC(3)
const d = fnD(4)
const e = fnE(5)
const f = fnF(6)
<<<<<<< HEAD
=======
const g = fnG(7)
const i = fnI(8)
const j = fnJ(9)
const k = fnK(10)
>>>>>>> 63b712596b42c471d882b4de058d4647d3b9a55c

const defaults = fnDefault(3)
const alias = fnAlias(6)
const fromSub = fnFromSub(7)

const _ = /*#__PURE__*/ fnEffects(1)
