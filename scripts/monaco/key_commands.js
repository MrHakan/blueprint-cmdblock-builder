window.registerEditorCommands = function (editor) {
    // Дублирование строки или выделения
    editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD,
        () => {
            const selection = editor.getSelection();
            const model = editor.getModel();
            if (!selection || !model) return;

            if (selection.isEmpty()) {
                const lineNumber = selection.startLineNumber;
                const lineContent = model.getLineContent(lineNumber);

                editor.pushUndoStop();
                model.pushEditOperations([], [{
                    range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                    text: lineContent + '\n',
                    forceMoveMarkers: true
                }], () => null);
                editor.pushUndoStop();
            } else {
                const text = model.getValueInRange(selection);
                const insertBefore = new monaco.Range(
                    selection.startLineNumber,
                    1,
                    selection.startLineNumber,
                    1
                );

                editor.pushUndoStop();
                model.pushEditOperations([selection], [{
                    range: insertBefore,
                    text: text + '\n',
                    forceMoveMarkers: true
                }], () => null);
                editor.pushUndoStop();
            }
        });

    editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.UpArrow,
        () => moveLine(editor, monaco, true)
    );

    editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow,
        () => moveLine(editor, monaco, false)
    );
}

function moveLine(editor, monaco, isUp) {
    const model = editor.getModel();
    const selection = editor.getSelection();
    if (!model || !selection) return;

    let startLine = selection.startLineNumber;
    let endLine = selection.endLineNumber;

    const totalLines = model.getLineCount();

    // Если выделение заканчивается в начале строки, не включаем последнюю строку
    if (selection.endColumn === 1 && startLine !== endLine) {
        endLine -= 1;
    }

    // Границы
    if (isUp && startLine === 1) return;
    if (!isUp && endLine === totalLines) return;

    const movingLine = isUp
        ? model.getLineContent(startLine - 1)
        : model.getLineContent(endLine + 1);

    const selectedLines = [];
    for (let i = startLine; i <= endLine; i++) {
        selectedLines.push(model.getLineContent(i));
    }

    const newText = isUp
        ? [...selectedLines, movingLine].join('\n')
        : [movingLine, ...selectedLines].join('\n');

    const editRange = isUp
        ? new monaco.Range(startLine - 1, 1, endLine + 1, 1)
        : new monaco.Range(startLine, 1, endLine + 2, 1);
    editor.pushUndoStop();
    model.pushEditOperations([], [{
        range: editRange,
        text: newText + '\n'
    }], () => null);
    editor.pushUndoStop();

    const offset = isUp ? -1 : 1;
    editor.setSelection(new monaco.Selection(
        startLine + offset,
        selection.startColumn,
        endLine + offset,
        selection.endColumn
    ));
}
