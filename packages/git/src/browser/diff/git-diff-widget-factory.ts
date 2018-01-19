/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { WidgetFactory, LabelProvider, OpenerService } from "@theia/core/lib/browser";
import { GitDiffWidget } from "./git-diff-widget";
import { inject, injectable } from "inversify";
import { Git } from "../../common";
import { GitRepositoryProvider } from "../git-repository-provider";

@injectable()
export class GitDiffWidgetFactory implements WidgetFactory {

    static ID = "git-diff-widget-factory";

    readonly id = GitDiffWidgetFactory.ID;

    @inject(Git) protected readonly git: Git;
    @inject(GitRepositoryProvider) protected repositoryProvider: GitRepositoryProvider;
    @inject(LabelProvider) protected labelProvider: LabelProvider;
    @inject(OpenerService) protected openerService: OpenerService;

    createWidget(): GitDiffWidget {
        return new GitDiffWidget(this.git, this.repositoryProvider, this.labelProvider, this.openerService);
    }
}
