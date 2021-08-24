
 var nodeList=[];
 var beginLine=[];
 var endLine=[];
 var nodeNum=0;

 var isIfStatment=false;
 var isWhileStatment=false;

 function addSatrtNode(){
    nodeList.push("start");
   
}

function addStartStatmentLine() { 

          beginLine.push("start");
          endLine.push(1);
     
}

 function addnode(){
     nodeList.push(nodeNum);
    
}

function next(){
    nodeNum=nodeNum+1;
}

 function addStatmentLine() { 
     if(nodeNum >= 0){
           beginLine.push(nodeNum);
           endLine.push(nodeNum+1);
     }
      
}

function addIFLine(num1,num2) { 
    beginLine.push(num1);
    endLine.push(num2);
}

function InputStream(input) {
      var pos = 0, line = 1, col = 0;
      return {
          next  : next,
          peek  : peek,
          eof   : eof,
          croak : croak,
      };
      function next() {
          var ch = input.charAt(pos++);
          if (ch == "\n") line++, col = 0; else col++;
          return ch;
      }
      function peek() {
          return input.charAt(pos);
      }
      function eof() {
          return peek() == "";
      }
      function croak(msg) {
          //console.log(msg + " (" + line + ":" + col + ")");
          throw new Error(msg + " (" + line + ":" + col + ")");
      }
  }

function TokenStream(input) {
      var current = null;
      var keywords = " string int if then else lambda λ true false while var ";
      return {
          next  : next,
          peek  : peek,
          eof   : eof,
          croak : input.croak
      };
      function is_keyword(x) {
          //console.log("*****"+keywords.indexOf(" " + x + " ")  )
          if(keywords.indexOf(" " + x + " ") >= 0){
              return true ;
          }
          
          else{
              return false;
          } 
      }
      function is_digit(ch) {
          return /[0-9]/i.test(ch);
      }
      function is_id_start(ch) {
          return /[a-zλ_]/i.test(ch);
      }
      function is_id(ch) {
          return is_id_start(ch) || "?!-<>=0123456789".indexOf(ch) >= 0;
      }
      function is_op_char(ch) {
          return "+-*/%=&|<>!".indexOf(ch) >= 0;
      }
      function is_punc(ch) {
          return ",;(){}[]".indexOf(ch) >= 0;
      }
      function is_whitespace(ch) {
          return " \t\n".indexOf(ch) >= 0;
      }
      function read_while(predicate) {
          var str = "";
          while (!input.eof() && predicate(input.peek()))
              str += input.next();
          return str;
      }
      function read_number() {
          var has_dot = false;
          var number = read_while(function(ch){
              if (ch == ".") {
                  if (has_dot) return false;
                  has_dot = true;
                  return true;
              }
              return is_digit(ch);
          });
          return { type: "num", value: parseFloat(number) };
      }
      function read_ident() {
          var id = read_while(is_id);
          
          return {
              type  : is_keyword(id) ? "kw" : "var",
              value : id
          };
      }
      function read_escaped(end) {
          var escaped = false, str = "";
          input.next();
          while (!input.eof()) {
              var ch = input.next();
              if (escaped) {
                  str += ch;
                  escaped = false;
              } else if (ch == "\\") {
                  escaped = true;
              } else if (ch == end) {
                  break;
              } else {
                  str += ch;
              }
          }
          return str;
      }
      function read_string() {
          return { type: "str", value: read_escaped('"') };
      }
      function skip_comment() {
          read_while(function(ch){ return ch != "\n" });
          input.next();
      }
      function read_next() {
          read_while(is_whitespace);
          if (input.eof()) return null;
          var ch = input.peek();
          if (ch == "#") {
              skip_comment();
              return read_next();
          }
          if (ch == '"') return read_string();
          if (is_digit(ch)) return read_number();
          if (is_id_start(ch)) return read_ident();
          if (is_punc(ch)) return {
              type  : "punc",
              value : input.next()
          };
          if (is_op_char(ch)) return {
              type  : "op",
              value : read_while(is_op_char)
          };
          input.croak("Can't handle character: " + ch);
      }
      function peek() {
          return current || (current = read_next());
      }
      function next() {
          var tok = current;
          current = null;
          return tok || read_next();
      }
      function eof() {
          return peek() == null;
      }
  }

function Parse(input) {

      var PRECEDENCE = {
          "=": 1,
          "||": 2,
          "&&": 3,
          "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
          "+": 10, "-": 10,
          "*": 20, "/": 20, "%": 20,
      };
      var FALSE = { type: "bool", value: false };
      return parse_toplevel();

      function is_punc(ch) {
          var tok = input.peek();
          return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
      }

      function is_kw(kw) {
          var tok = input.peek();
          return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
      }

      function is_op(op) {
          var tok = input.peek();
          return tok && tok.type == "op" && (!op || tok.value == op) && tok;
      }
      function skip_punc(ch) {
          if (is_punc(ch)) input.next();
          else input.croak("Expecting punctuation: \"" + ch + "\"");
      }
      function skip_kw(kw) {
          if (is_kw(kw)) input.next();
          else input.croak("Expecting keyword: \"" + kw + "\"");
      }
      function unexpected() {
          input.croak("Unexpected token: " + JSON.stringify(input.peek()));
      }
      function maybe_binary(left, my_prec) {
          var tok = is_op();
          if (tok) {
              var his_prec = PRECEDENCE[tok.value];
              if (his_prec > my_prec) {
                  input.next();
                  maybe_binary(parse_atom(), his_prec)
                  return maybe_binary('Statment', my_prec);
              }
          }
          return left;
      }
      function delimited(start, stop, separator, parser) {
          var a = [], first = true;
          skip_punc(start);
          while (!input.eof()) {
              if (is_punc(stop)) break;
              if (first) first = false; else skip_punc(separator);
              if (is_punc(stop)) break;
              a.push(parser());
          }
          skip_punc(stop);
          return a;
      }
      function parse_call(func) {
          return {
              type: "call",
              func: func,
              args: delimited("(", ")", ",", parse_expression),
          };
      }
      function parse_varname() {
          var name = input.next();
          if (name.type != "var") input.croak("Expecting variable name");
          return name.value;
      }
      function parse_identifier_int() {
          skip_kw("int");
          var varName = parse_varname();
          //addnode();
          //addStatmentLine();
          var ret = "Statment"
  
          return ret;
      }
      function parse_identifier_string() {
          skip_kw("string");
          var varName = parse_varname();
          var ret ="Statment";
          return ret;
      }
      function parse_if() {
    
          skip_kw("if");
          var cond = parse_expression();
          if (!is_punc("{")) skip_kw("then");
          var then=0;
          var then =parse_expression();
          var res=JSON.stringify(then)
          var str=res.replace(/\\/g,'');
          var ret ={
              type:'If',
              body: then
          };
        
          var elseNum=0;
          if (is_kw("else")) {  
              input.next();
               elseNum=parse_expression();
              ret.else = JSON.stringify(elseNum);
          }
          isIfStatment=false;
          return ret;
      }
      function parse_while() {
          skip_kw("while");
          var cond = parse_expression();
          if (!is_punc("{")) skip_kw("then");
          var then = parse_expression();
          var res=JSON.stringify(then);
          var str=res.replace(/\\/g,'');;
          var ret = {
              type: 'While',
              body:  then
          };
          isWhileStatment=false;
          //nodeNum=nodeNum+1;
          return ret;
      }
      function parse_lambda() {
          return {
              type: "lambda",
              vars: delimited("(", ")", ",", parse_varname),
              body: parse_expression()
          };
      }
      function parse_bool() {
          return {
              type  : "bool",
              value : input.next().value == "true"
          };
      }
      function maybe_call(expr) {
          expr = expr();
          return is_punc("(") ? parse_call(expr) : expr;
      }
      function parse_atom() {
          return maybe_call(function(){
              if (is_punc("(")) {
                  input.next();
                  var exp = parse_expression();
                  skip_punc(")");
                  return exp;
              }
              if (is_punc("{")) return parse_prog();
              if (is_kw("if")) { isIfStatment=true; return parse_if();}
              if (is_kw("int")) { return parse_identifier_int();}
              if (is_kw("string")) { return parse_identifier_string();}
              if (is_kw("while")) {isWhileStatment=true; return parse_while();}
              if (is_kw("true") || is_kw("false")) return parse_bool();
              if (is_kw("lambda") || is_kw("λ")) {
                  input.next();
                  return parse_lambda();
              }
              var tok = input.next();
              if (tok.type == "var" || tok.type == "num" || tok.type == "str")
                  return tok;
              unexpected();
          });
      }
      function parse_toplevel() {
          var prog = [];
          while (!input.eof()) {
              prog.push(parse_expression());
          
              if (!input.eof()) skip_punc(";");
          }
          return prog;
      }
      function parse_prog() {
          var prog = delimited("{", "}", ";", parse_expression);
          if (prog.length == 0) return FALSE;
          if (prog.length == 1) return prog[0];
          return prog;
      }
      function parse_expression() {
          return maybe_call(function(){
              return maybe_binary(parse_atom(), 0);
          });
      }
  }

  function init() {
      
    var $ = go.GraphObject.make; 
     // for conciseness in defining templates
     var myDiagram ;
    
     myDiagram =
      $(go.Diagram, "myDiagramDiv",  // create a Diagram for the DIV HTML element
        { // enable undo & redo
          "undoManager.isEnabled": true,
          //layout: $(go.TreeLayout, { angle: 90 })
        });
   
    // define a simple Node template
    myDiagram.nodeTemplate =
    $(go.Node, "Auto", // the Shape will go around the TextBlock
        $(go.Shape, "Circle",
          { strokeWidth: 0, fill: "white" },  // default fill is white
          // Shape.fill is bound to Node.data.color
          new go.Binding("fill", "color")),
        $(go.TextBlock,
          { margin: 8 },  // some room around the text
          // TextBlock.text is bound to Node.data.key
          new go.Binding("text", "key"))
          
      );
      


    // but use the default Link template, by not setting Diagram.linkTemplate

    // create the model data that will be represented by Nodes and Links
    var nodesArr=[ ];
    var linesArr=[ ];

    for(var i=0;i<nodeList.length;i++){
        nodesArr.push({"key": nodeList[i] } );
    };

    for(var i=0;i<beginLine.length;i++){
        linesArr.push({"from": beginLine[i] , "to" : endLine[i]});
    };

    myDiagram.model = new go.GraphLinksModel(
    nodesArr,linesArr
    );

  }

function runCode() {

      nodeList=[];
      beginLine=[];
      endLine=[];
      nodeNum=0;

      var input=document.getElementById('codeText').value;
      var ast = Parse(TokenStream(InputStream(input)));
      var astArray=JSON.stringify(ast)
     .replace(/\\/g , '')
     .replace(/"/g , '')
     .replace(/type:/g ,'');
      var res ="";
      var res=JSON.stringify(astArray);
      document.getElementById('outputText').value=res;
      addSatrtNode();
      addStartStatmentLine();
      drawGraph(ast,false);
      
}

function drawText() {
      init();
}

function drawStatement(){
    next();
    addnode();
    addStatmentLine();
}

function drawIf(ast){
   
    next();
    addnode()
    addStatmentLine();
    var s=nodeNum;
    var e= ast=="Statment" ? s+2 :s+statmentCount(ast)+1;
    if(ast=="Statment"){
        next();
        addnode()
        addStatmentLine();
    }else{
        drawGraph(ast);
    }
    addIFLine(s,e)
}

function drawWhile(ast){
    next();
    addnode()
    addStatmentLine();
    var s=nodeNum;
    var e= ast=="Statment" ? s+2 : s+statmentCount(ast)+1;
    if(ast=="Statment"){
        next();
        addnode()
        addIFLine(nodeNum , s);
    }else{
        drawGraph(ast,true,s);
    }
    addIFLine(s,e)
}

function drawGraph(ast,isWhile=false , s=0) {
    
    for(var i=0; i<ast.length;i++){
        if(isWhile && i==ast.length-1){
            next();
            addnode()
            addIFLine(nodeNum , s);
        }
        else if(ast[i]=="Statment") {
            drawStatement();
        }
        else if (typeof ast[i] == "object") 
        {
            if(ast[i].type =="If")
            {
                drawIf(ast[i].body)
            }
            else if(ast[i].type =="While")
            {
                drawWhile(ast[i].body)
            }
        }
    }
}

function statmentCount(ast){
    var arr =JSON.stringify(ast).split(",");
    var num=0;
    for(var i=0; i<arr.length;i++){
      if(arr[i].includes("Statment")) num++;
      if(arr[i].includes("If")) num++;
      if(arr[i].includes("While")) num++;
    }
    return num;
}


/*var input = " int x; int h; while(y=1) { t=t+1; }; y=y+1; ";

 var ast = Parse(TokenStream(InputStream(input)));
 var astArray=JSON.stringify(ast)
 .replace(/\\/g , '')
 .replace(/"/g , '')
 .replace(/type:/g ,'');
 drawGraph(ast)
 console.log(statmentCount(ast));
console.log(ast);*/

