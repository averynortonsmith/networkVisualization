# networkVisualization
run seq-to-seq translation experiments, and visualize network activations

## installation
(need python3 and anaconda installed)

```
git clone https://github.com/averynortonsmith/networkVisualization.git
cd networkVisualization/
git submodule init
git submodule update

conda env create -f conda-environment.yml -n networkVisEnv
source activate networkVisEnv

pip install https://github.com/pytorch/text/archive/master.zip

mkdir models
wget http://people.csail.mit.edu/averyn/networkVisualization/models/en-es-1.pt -O ./models/en-es-1.pt

python vis-server.py
```
