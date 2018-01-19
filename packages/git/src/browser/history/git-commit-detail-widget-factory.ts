/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { WidgetFactory, LabelProvider, OpenerService } from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";
import { Git } from "../../common";
import { GitRepositoryProvider } from "../git-repository-provider";
import { GitCommitDetailWidget, GitCommitDetailWidgetOptions } from "./git-commit-detail-widget";

@injectable()
export class GitCommitDetailWidgetFactory implements WidgetFactory {

    static ID = "git-commit-detail-widget-factory";

    readonly id = GitCommitDetailWidgetFactory.ID;

    @inject(Git) protected readonly git: Git;
    @inject(GitRepositoryProvider) protected readonly repositoryProvider: GitRepositoryProvider;
    @inject(LabelProvider) protected readonly labelProvider: LabelProvider;
    @inject(OpenerService) protected readonly openerService: OpenerService;

    createWidget(options: GitCommitDetailWidgetOptions): GitCommitDetailWidget {
        return new GitCommitDetailWidget(
            this.git, this.repositoryProvider, this.labelProvider, this.openerService, options);
    }
}
