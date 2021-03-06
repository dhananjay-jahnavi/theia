/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from "inversify";
import { EditorDecorationsService, OverviewRulerLane, Range, DecorationType, EditorDecorationTypeProvider } from "@theia/editor/lib/browser";
import { MergeConflictUpdateParams } from "./merge-conflicts-service";

export enum MergeConflictsDecorationType {
    CurrentMarker = 'merge-conflict-current-marker',
    CurrentContent = 'merge-conflict-current-content',
    BaseMarker = 'merge-conflict-base-marker',
    BaseContent = 'merge-conflict-base-content',
    IncomingMarker = 'merge-conflict-incoming-marker',
    IncomingContent = 'merge-conflict-incoming-content',
}

const Type = MergeConflictsDecorationType;

@injectable()
export class MergeConflictsDecorations implements EditorDecorationTypeProvider {

    constructor(
        @inject(EditorDecorationsService) protected readonly decorationsService: EditorDecorationsService,
    ) { }

    get(): DecorationType[] {
        return [
            {
                type: Type.CurrentMarker,
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                isWholeLine: true,
            },
            {
                type: Type.CurrentContent,
                backgroundColor: 'rgba(0, 255, 0, 0.3)',
                isWholeLine: true,
                overviewRulerColor: 'rgba(0, 255, 0, 0.3)',
                overviewRulerLane: OverviewRulerLane.Full
            },
            {
                type: Type.BaseMarker,
                backgroundColor: 'rgba(125, 125, 125, 0.1)',
                isWholeLine: true,
            },
            {
                type: Type.BaseContent,
                backgroundColor: 'rgba(125, 125, 125, 0.3)',
                isWholeLine: true,
                overviewRulerColor: 'rgba(125, 125, 125, 0.3)',
                overviewRulerLane: OverviewRulerLane.Full
            },
            {
                type: Type.IncomingMarker,
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                isWholeLine: true,
            },
            {
                type: Type.IncomingContent,
                backgroundColor: 'rgba(0, 0, 255, 0.3)',
                isWholeLine: true,
                overviewRulerColor: 'rgba(0, 0, 255, 0.3)',
                overviewRulerLane: OverviewRulerLane.Full
            }
        ];
    }

    onMergeConflictUpdate(params: MergeConflictUpdateParams): void {
        const uri = params.uri;
        const mergeConflicts = params.mergeConflicts;
        this.decorationsService.setDecorations(uri, Type.CurrentMarker, mergeConflicts.map(mergeConflict => ({ range: mergeConflict.current.marker! })));
        this.decorationsService.setDecorations(uri, Type.CurrentContent, mergeConflicts.map(mergeConflict => ({ range: mergeConflict.current.content! })));
        this.decorationsService.setDecorations(uri, Type.IncomingMarker, mergeConflicts.map(mergeConflict => ({ range: mergeConflict.incoming.marker! })));
        this.decorationsService.setDecorations(uri, Type.IncomingContent, mergeConflicts.map(mergeConflict => ({ range: mergeConflict.incoming.content! })));

        const baseMarkerRanges: Range[] = [];
        const baseContentRanges: Range[] = [];
        mergeConflicts.forEach(c => c.bases.forEach(b => {
            if (b.marker) {
                baseMarkerRanges.push(b.marker);
            }
            if (b.content) {
                baseContentRanges.push(b.content);
            }
        }));
        this.decorationsService.setDecorations(uri, Type.BaseMarker, baseMarkerRanges.map(range => ({ range })));
        this.decorationsService.setDecorations(uri, Type.BaseContent, baseContentRanges.map(range => ({ range })));
    }

}
