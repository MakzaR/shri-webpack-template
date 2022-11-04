import {Compiler} from 'webpack';
import {writeFileSync} from "fs";
import {join} from 'path';
import {readdir} from "fs/promises";

interface Options {
    directory?: string,
    output?: string,
    whiteList?: RegExp[],
}

class ModuleLogger {
    private options: Options;

    static defaultOptions: Options = {
        directory: '',
        output: 'unused.json',
        whiteList: [],
    }

    private unusedModules: string[];

    constructor(options?: Options) {
        this.options = {...ModuleLogger.defaultOptions, ...options};
    }

    async readModules(path: string) {
        try {
            let modules: string[] = [];
            let excluded = false;

            const modulesInDirectory = await readdir(path, {withFileTypes: true});

            for (const module of modulesInDirectory) {
                const modulePath = `${path}/${module.name}`

                excluded =this.options.whiteList.some((regexp) => regexp.test(modulePath));

                if (!excluded) {
                    if (module.isDirectory()) {
                        modules = [
                            ...modules,
                            ...(await this.readModules(modulePath))
                        ];
                    } else {
                        modules.push(modulePath);
                    }
                }
            }

            return modules;
        } catch (error) {
            throw new Error(`Unable to read directory: ${error.message}`);
        }
    }

    writeModules() {
        writeFileSync(this.options.output, JSON.stringify(this.unusedModules));
    }

    apply(compiler: Compiler) {
        const pluginName = ModuleLogger.name;

        compiler.hooks.emit.tapPromise(pluginName, async (compilation) => {
            const usedModules = compilation.fileDependencies;
            const root = compiler.context;

            const initialPath = join(root, this.options.directory);

            const modules = await this.readModules(initialPath);
            const usedModulesSet = new Set(Array.from(usedModules));

            this.unusedModules = modules.filter((module) => !usedModulesSet.has(module));
        });

        compiler.hooks.done.tap(pluginName, () => {
            this.writeModules();
        })
    }
}

export default ModuleLogger;