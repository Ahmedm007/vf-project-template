# Change Log

- 3.0.0 - 2022-06-22 (@ibliskavka, @matthewloller-vf)
  - Replace CodeArtifact with `npm pack` scripts.
    - `npm run installPackFiles` to add `@ttec-dig-vf` dependencies to repo
    - `npm run resetPackFiles` to switch back to GitHub registry (for upgrading)

- 2.1.1 - 2022-06-20 (@ibliskavka)
  - WIN-766 - Pass `kvsEncryptionKeyArn` to vmail stack

- 2.1.0 - 2022-06-20 (@ibliskavka)
  - Don't require aws profile for synth
  - Added `existingConnect` prop for binding to existing instances
  - Look up `connectInstanceId` via ConnectCore Stack Export/Import
  - Use `npx` and `ts-node` to simplify `package.json` scripts

- 2.0.0 - 2022-04-20 (@JustinSmith-VF)
  - [WIN-656](https://humanify.atlassian.net/browse/WIN-656)
    - updated CDK to v2.x
    - updated vf-connect-admin to v4.0.2
    - updated connect-voicemail to v4.0.1
  - [PR#30](https://github.com/TTEC-Dig-VF/vf-project-template/pull/30)
    - bump cdk-resources to ^6.0.0
    - fixed streaming bug
  - [WIN-588](https://humanify.atlassian.net/browse/WIN-588)
    - simplify ddb interaction in demo lambda

- 1.0.0 - 2022-04-07 (@Aidanchase)
  - [WIN-411](https://humanify.atlassian.net/browse/WIN-411)
    - added git version check
  - [WIN-631](https://humanify.atlassian.net/browse/WIN-631)
    - move to npm workspaces
