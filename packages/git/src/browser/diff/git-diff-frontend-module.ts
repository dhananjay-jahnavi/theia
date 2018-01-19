/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { interfaces } from "inversify";
import { GitDiffContribution } from './git-diff-contribution';
import { WidgetFactory } from "@theia/core/lib/browser";
import { CommandContribution, MenuContribution } from '@theia/core';

import '../../../src/browser/style/diff.css';
import { GitDiffWidgetFactory } from './git-diff-widget-factory';

export function bindGitDiffModule(bind: interfaces.Bind) {

    bind(WidgetFactory).to(GitDiffWidgetFactory).inSingletonScope();

    bind(GitDiffContribution).toSelf().inSingletonScope();
    for (const identifier of [CommandContribution, MenuContribution]) {
        bind(identifier).toDynamicValue(ctx =>
            ctx.container.get(GitDiffContribution)
        ).inSingletonScope();
    }

}
