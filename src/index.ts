import dayjs from "dayjs";
import fs from "fs";
import child_process from "child_process"

export default class VersionPlugin {

    constructor() {

    }

    pluginName = 'VersionPlugin'

    apply(compiler) {
        compiler.hooks.emit.tapAsync(this.pluginName, (compilation, cb) => {
            for (const filename in compilation.assets) {
                let source = compilation.assets[filename].source();
                if (filename.includes('index')) {
                    source = source.replace('</body>', this.getInjectContent());
                }
                // source = '/* https://www.fotor.com */\n' + source
                compilation.assets[filename] = {
                    source: function () {
                        return source
                    },
                    size: function () {
                        return source.length
                    }
                }
            }
            cb()
        });
        compiler.hooks.done.tap(this.pluginName, (compilation) => {
            console.log('webpack 构建完毕！');
        });
    }

    getInjectContent(): string {
        const env = process.env;

        const commitHash = env.CI_COMMIT_TITLE + env.CI_COMMIT_SHA

        const branch = env.CI_COMMIT_REF_NAME

        const user = env.GITLAB_USER_NAME

        const pkg = fs.readFileSync(process.cwd() + '/package.json', 'utf-8')

        const { name, version } = JSON.parse(pkg);

        const nodeVersion = this.getNodeVersion()

        return `
		<script type="text/javascript">
        const styles = "${this.getStyle().join(';')}"
        console.log(
            \`%c打包时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\`,
            styles,
        );
        console.log(\`%c分支: ${branch || '-'}\`, styles);
        console.log(\`%cCOMMIT信息: ${commitHash || '-'}\`, styles);
        console.log(\`%c执行人: ${user || '-'}\`, styles);
        console.log(\`%c项目: ${name || '-'}\`, styles);
        console.log(\`%c版本: ${version || '-'}\`, styles);
        console.log(\`%c构建node版本: ${nodeVersion || '-'}\`, styles);
        </script></body>`;
    }

    getNodeVersion() {
        const result = child_process.execSync('node -v', {
            encoding: 'utf-8'
        })
        console.log(result)
        return result
    }

    getStyle() {
        return [
            'color: white',
            'background: green',
            'font-size: 19px',
            'border: 1px solid #fff',
            'text-shadow: 2px 2px black',
            'padding: 5px',
        ]
    }
}
