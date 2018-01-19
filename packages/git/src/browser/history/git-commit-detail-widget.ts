/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { GitDiffWidget } from "../diff/git-diff-widget";
import { Git } from "../../common";
import { GitRepositoryProvider } from "../git-repository-provider";
import { LabelProvider, OpenerService } from "@theia/core/lib/browser";
import { h } from "@phosphor/virtualdom";
import { GitCommitNode } from "./git-history-widget";
import { Md5 } from "ts-md5";

export interface GitCommitDetailWidgetOptions {
    readonly widgetId: string;
    readonly widgetLabel: string;
    readonly commit: GitCommitNode;
    readonly diffOptions: Git.Options.Diff;
}

export class GitCommitDetailWidget extends GitDiffWidget {

    constructor(
        protected readonly git: Git,
        protected readonly repositoryProvider: GitRepositoryProvider,
        protected readonly labelProvider: LabelProvider,
        protected readonly openerService: OpenerService,
        protected readonly commitDetailOptions: GitCommitDetailWidgetOptions
    ) {
        super(git, repositoryProvider, labelProvider, openerService);

        this.id = commitDetailOptions.widgetId;
        this.title.label = commitDetailOptions.widgetLabel;
        this.options = commitDetailOptions.diffOptions;
    }

    protected renderDiffListHeader(): h.Child {
        const elements = [];
        const authorEMail = this.commitDetailOptions.commit.authorEmail;
        const hash = Md5.hashStr(authorEMail);
        const subject = h.div({ className: "subject" }, this.commitDetailOptions.commit.commitMessage);
        const body = h.div({ className: "body" }, this.commitDetailOptions.commit.messageBody || "");
        const subjectRow = h.div({ className: "header-row" }, h.div({ className: "subjectContainer" }, subject, body));
        const author = h.div({ className: "author header-value" }, this.commitDetailOptions.commit.authorName);
        const mail = h.div({ className: "mail header-value" }, `<${authorEMail}>`);
        const authorRow = h.div({ className: "header-row" }, h.div({ className: 'theia-header' }, 'author: '), author);
        const mailRow = h.div({ className: "header-row" }, h.div({ className: 'theia-header' }, 'e-mail: '), mail);
        const date = h.div({ className: "date header-value" }, this.commitDetailOptions.commit.authorDate.toString());
        const dateRow = h.div({ className: "header-row" }, h.div({ className: 'theia-header' }, 'date: '), date);
        const revisionRow = h.div({ className: 'header-row' },
            h.div({ className: 'theia-header' }, 'revision: '),
            h.div({ className: 'header-value' }, this.commitDetailOptions.commit.commitSha));
        const gravatar = h.div({},
            h.img({ className: "gravatar", width: "100px", height: "100px", src: `https://www.gravatar.com/avatar/${hash}?d=robohash` }));
        const commitInfo = h.div({ className: "header-row commit-info-row" }, gravatar, h.div({ className: "commit-info" }, authorRow, mailRow, dateRow, revisionRow));
        elements.push(subjectRow, commitInfo);
        const header = h.div({ className: 'theia-header' }, 'Files changed');

        return h.div({ className: "diff-header" }, ...elements, header);
    }

}
