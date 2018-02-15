/*
 * Copyright (C) 2018 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable } from 'inversify';
import { MetricsContribution } from '@theia/metrics/lib/node';
import { ExtensionServer } from '../common/extension-protocol';

@injectable()
export class ExtensionManagerMetricsContribution implements MetricsContribution {
    metrics: string = "";
    constructor(@inject(ExtensionServer) readonly extensionManager: ExtensionServer) { }

    getMetrics(): string {
        return this.metrics;
    }

    startCollecting(): void {
        let latestMetrics = "";
        const installedExtensions = this.extensionManager.list();
        installedExtensions.then(extensionsInfos => {
            extensionsInfos.forEach(extensionInfo => {
                /* TODO Make sure that theia extensions really always follow @theia/something pattern ? and only one /*/
                const extensionName = extensionInfo.name.split('/')[1];
                const metricsName = 'theia_extension_' + extensionName;
                const metricsValue = metricsName + `{version="${extensionInfo.version}"} 1`;
                latestMetrics += metricsValue + '\n';
            });

            this.metrics = latestMetrics;
        });
    }
}
