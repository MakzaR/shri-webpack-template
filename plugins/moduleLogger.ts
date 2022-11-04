import { Compiler } from 'webpack';
import fg from 'fast-glob';
import {writeFileSync} from "fs";
import {writeFile} from "fs/promises";
import { join } from 'path';
import {assignWith} from "lodash";

interface Options {
    root?: string,
    output?: string,
    blackList?: string[],
    pattern?: string
}

class ModuleLogger {
    private options: Options;

    private unusedModules: string[] = [];

    static defaultOptions: Options = {
        // blackList: ['**/node_modules/**', '**/index.html'],
        root: '',
        output: 'unused.json',
        blackList: [],
        pattern: '**'
    }

    constructor(options?: Options) {
        this.options = {...ModuleLogger.defaultOptions, ...options};
    }

    async getModules(contextPath: string, root: string, pattern: string) {
        const path = join(contextPath, root, pattern);
        return fg(path, {
            ignore: this.options.blackList
        });
    }

    apply(compiler: Compiler) {
        const pluginName = ModuleLogger.name;

        compiler.hooks.afterEmit.tap(pluginName, async (compilation) => {
            const usedModules = compilation.fileDependencies;
            const contextPath = compiler.context;

            const modules = await this.getModules(contextPath, this.options.root, this.options.pattern);
            const usedModulesSet = new Set(Array.from(usedModules));

            const unusedModules = modules.filter((module) => !usedModulesSet.has(module));

            writeFileSync(this.options.output, JSON.stringify(unusedModules));
        });
    }
}

export default ModuleLogger;