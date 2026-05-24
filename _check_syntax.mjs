import { parse } from '@babel/parser'
import fs from 'fs'

const files = [
  'src/components/transactions/TransactionForm.jsx',
  'src/components/ui/CalculatorPad.jsx',
  'src/hooks/useMonth.jsx',
  'src/lib/formatters.js',
  'src/components/layout/MonthSwitcher.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Calendar.jsx',
  'src/pages/Budget.jsx',
  'src/components/dashboard/CategoryDonut.jsx',
  'src/components/dashboard/RecentTransactions.jsx',
  'src/components/transactions/TransactionList.jsx',
]

let ok = true
for (const f of files) {
  try {
    const code = fs.readFileSync(f, 'utf8')
    parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'topLevelAwait', 'optionalChaining', 'nullishCoalescingOperator'],
      errorRecovery: false,
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
    })
    console.log('OK   ' + f)
  } catch (err) {
    ok = false
    console.log('FAIL ' + f + '  →  ' + err.message + '  at  line ' + (err.loc?.line ?? '?'))
    // print a few lines around the error
    const code = fs.readFileSync(f, 'utf8').split('\n')
    const ln = err.loc?.line ?? 0
    for (let i = Math.max(0, ln-2); i < Math.min(code.length, ln+1); i++) {
      console.log('   ' + (i+1) + ': ' + code[i])
    }
  }
}
process.exit(ok ? 0 : 1)
