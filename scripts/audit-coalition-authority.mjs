import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(projectRoot, 'src');
const coalitionAuthorityFile = 'src/game/utils/coalition.ts';
const electionAuthorityFiles = new Set([
  'src/game/events/early_general_election.ts',
  'src/game/events/elections_1931_results.tsx',
  'src/game/events/elections_1933.ts',
  'src/game/events/elections_1936.ts'
]);
const resetOnlyFiles = new Set([
  'src/game/GameContext.tsx',
  'src/components/SandboxMenu.tsx'
]);

const issues = [];

const toProjectPath = (absolutePath) => (
  path.relative(projectRoot, absolutePath).split(path.sep).join('/')
);

const collectSourceFiles = (directory) => {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolutePath));
    } else if (/\.tsx?$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
};

const addIssue = (sourceFile, node, message) => {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  issues.push(`${toProjectPath(sourceFile.fileName)}:${position.line + 1}:${position.character + 1} ${message}`);
};

const propertyName = (node) => {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return null;
};

const calledName = (expression) => {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  if (ts.isElementAccessExpression(expression) && expression.argumentExpression) {
    return propertyName(expression.argumentExpression);
  }
  return null;
};

const isFalseLiteral = (node) => node?.kind === ts.SyntaxKind.FalseKeyword;
const isTrueLiteral = (node) => node?.kind === ts.SyntaxKind.TrueKeyword;
const isNullLiteral = (node) => node?.kind === ts.SyntaxKind.NullKeyword;

const findFunction = (sourceFile, name) => {
  let match = null;
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      match = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return match;
};

const findCall = (node, name) => {
  let match = null;
  const visit = (child) => {
    if (match) return;
    if (ts.isCallExpression(child) && calledName(child.expression) === name) {
      match = child;
      return;
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return match;
};

const hasReturnedProperty = (node, name, predicate) => {
  let found = false;
  const visit = (child) => {
    if (found) return;
    if (
      ts.isPropertyAssignment(child)
      && propertyName(child.name) === name
      && predicate(child.initializer)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
};

const auditAuthorityImplementation = (sourceFile) => {
  const establish = findFunction(sourceFile, 'establishCoalition');
  const ordinary = findFunction(sourceFile, 'formCoalition');
  const elected = findFunction(sourceFile, 'formRulingCoalitionFromElection');

  if (!establish) {
    issues.push(`${coalitionAuthorityFile}: missing private establishCoalition implementation`);
  } else if (establish.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
    addIssue(sourceFile, establish, 'establishCoalition must remain private to the coalition authority module.');
  }

  if (!ordinary) {
    issues.push(`${coalitionAuthorityFile}: missing formCoalition public API`);
  } else {
    if (ordinary.parameters.length !== 2) {
      addIssue(sourceFile, ordinary, 'formCoalition must accept only state and coalition id; it cannot expose a ruling flag.');
    }
    const call = findCall(ordinary, 'establishCoalition');
    if (!call || call.arguments.length !== 3 || !isFalseLiteral(call.arguments[2])) {
      addIssue(sourceFile, ordinary, 'formCoalition must delegate to establishCoalition with asRuling=false.');
    }
  }

  if (!elected) {
    issues.push(`${coalitionAuthorityFile}: missing formRulingCoalitionFromElection public API`);
  } else {
    if (elected.parameters.length !== 2) {
      addIssue(sourceFile, elected, 'formRulingCoalitionFromElection must accept only state and coalition id.');
    }
    const call = findCall(elected, 'establishCoalition');
    if (!call || call.arguments.length !== 3 || !isTrueLiteral(call.arguments[2])) {
      addIssue(sourceFile, elected, 'formRulingCoalitionFromElection must delegate with asRuling=true.');
    }
    if (!hasReturnedProperty(elected, 'governmentCrisis', isNullLiteral)) {
      addIssue(sourceFile, elected, 'Installing an elected government must clear governmentCrisis.');
    }
    if (!hasReturnedProperty(elected, 'earlyElectionInProgress', isFalseLiteral)) {
      addIssue(sourceFile, elected, 'Installing an elected government must end earlyElectionInProgress.');
    }
  }
};

const auditSourceFile = (absolutePath) => {
  const relativePath = toProjectPath(absolutePath);
  const sourceText = fs.readFileSync(absolutePath, 'utf8');
  const scriptKind = relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(absolutePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);

  if (relativePath === coalitionAuthorityFile) {
    auditAuthorityImplementation(sourceFile);
  }

  const visit = (node) => {
    if (ts.isIdentifier(node) && node.text === 'autoFormCoalitionIfNeeded') {
      addIssue(sourceFile, node, 'automatic coalition formation bypasses election authority and is forbidden.');
    }

    if (relativePath !== coalitionAuthorityFile && ts.isIdentifier(node) && node.text === 'establishCoalition') {
      addIssue(sourceFile, node, 'establishCoalition is private; use the appropriate public coalition API.');
    }

    if (ts.isCallExpression(node)) {
      const name = calledName(node.expression);
      if (name === 'formCoalition' && node.arguments.length !== 2) {
        addIssue(sourceFile, node, 'formCoalition calls must pass exactly state and coalition id; a ruling flag is forbidden.');
      }
      if (name === 'formRulingCoalitionFromElection') {
        if (!electionAuthorityFiles.has(relativePath)) {
          addIssue(sourceFile, node, 'only an approved election-result module may install a ruling coalition.');
        }
        if (node.arguments.length !== 2) {
          addIssue(sourceFile, node, 'formRulingCoalitionFromElection calls must pass exactly state and coalition id.');
        }
      }
    }

    if (ts.isImportSpecifier(node)) {
      const importedName = node.propertyName?.text || node.name.text;
      if (importedName === 'formRulingCoalitionFromElection' && !electionAuthorityFiles.has(relativePath)) {
        addIssue(sourceFile, node, 'ruling-coalition authority may only be imported by approved election-result modules.');
      }
    }

    if (ts.isPropertyAssignment(node) && propertyName(node.name) === 'rulingCoalition') {
      const isAuthorityWrite = relativePath === coalitionAuthorityFile;
      const isApprovedReset = resetOnlyFiles.has(relativePath) && isNullLiteral(node.initializer);
      if (!isAuthorityWrite && !isApprovedReset) {
        addIssue(sourceFile, node, 'direct rulingCoalition writes are forbidden outside coalition authority (sandbox/initial null resets excepted).');
      }
    }

    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const leftName = ts.isPropertyAccessExpression(node.left)
        ? node.left.name.text
        : ts.isElementAccessExpression(node.left) && node.left.argumentExpression
          ? propertyName(node.left.argumentExpression)
          : null;
      if (leftName === 'rulingCoalition' && relativePath !== coalitionAuthorityFile) {
        addIssue(sourceFile, node, 'direct rulingCoalition assignment is forbidden outside coalition authority.');
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
};

const sourceFiles = collectSourceFiles(sourceRoot);
sourceFiles.forEach(auditSourceFile);

if (issues.length > 0) {
  console.error('Coalition authority audit failed:');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log(`Coalition authority audit passed (${sourceFiles.length} source files checked).`);
}
