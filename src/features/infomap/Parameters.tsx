import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  Input,
  Kbd,
  Text,
} from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import type { Ref } from "react";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { LuMinus, LuPlus, LuSearch, LuX } from "react-icons/lu";
import useStore from "../../state";
import type { InfomapParameter } from "../../state/types";

const parameterGroups = ["Input", "Output", "Algorithm", "Accuracy", "About"];
const parameterControlWidth = "8.5rem";

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const paramShortcuts: Record<string, string> = {
  "--two-level": "2",
  "--directed": "D",
};
const paramShortcut = (long: string): string | undefined =>
  paramShortcuts[long];

type ParameterMatch = "name" | "description" | null;

const stripFlagPrefix = (value: string) => value.replace(/(^|\s)--?/g, "$1");

const parameterLabel = (param: InfomapParameter) =>
  stripFlagPrefix(param.longString);

const parameterMatchType = (
  param: InfomapParameter,
  query: string,
): ParameterMatch => {
  if (!query) return "name";

  const nameFields = [
    param.long,
    param.short,
    param.longString,
    param.shortString,
    param.longType,
    ...(param.options ?? []),
  ];
  if (
    nameFields
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  ) {
    return "name";
  }

  if (param.description?.toLowerCase().includes(query)) return "description";
  return null;
};

const parameterMatches = (param: InfomapParameter, query: string) =>
  parameterMatchType(param, query) !== null;

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let index = lower.indexOf(query, cursor);
  while (index !== -1) {
    if (index > cursor) parts.push(text.slice(cursor, index));
    parts.push(
      <mark
        key={parts.length}
        style={{
          backgroundColor: "hsl(48, 95%, 75%)",
          color: "inherit",
          padding: 0,
          borderRadius: "2px",
        }}
      >
        {text.slice(index, index + query.length)}
      </mark>,
    );
    cursor = index + query.length;
    index = lower.indexOf(query, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function ToggleSwitch({
  id,
  checked,
  onChange,
  ariaLabel,
}: {
  id: string;
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <Box
      as="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      bg="transparent"
      border={0}
      p={0}
      cursor="pointer"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        aria-hidden="true"
        bg={checked ? "blue.500" : "gray.300"}
        borderRadius="full"
        boxShadow="inset 0 0 0 1px rgba(0, 0, 0, 0.08)"
        h="1.125rem"
        p="0.125rem"
        position="relative"
        transition="background 120ms ease"
        w="2rem"
      >
        <Box
          bg="white"
          borderRadius="full"
          boxShadow="0 1px 2px rgba(0, 0, 0, 0.2)"
          h="0.875rem"
          transform={checked ? "translateX(0.875rem)" : "translateX(0)"}
          transition="transform 120ms ease"
          w="0.875rem"
        />
      </Box>
    </Box>
  );
}

const DropdownParameter = ({ param }: { param: any }) => {
  const store = useStore();

  const selectStyle = {
    container: (provided) => ({
      ...provided,
      minW: "10rem",
    }),
    control: (provided) => ({
      ...provided,
      bg: "white",
      fontSize: "0.75rem",
      minH: "1.875rem",
    }),
    dropdownIndicator: (provided) => ({ ...provided, p: 1 }),
    input: (provided) => ({ ...provided, fontSize: "0.75rem" }),
    placeholder: (provided) => ({ ...provided, fontSize: "0.75rem" }),
    singleValue: (provided) => ({ ...provided, fontSize: "0.75rem" }),
    valueContainer: (provided) => ({
      ...provided,
      bg: "white",
      px: 2,
      w: "100%",
    }),
  };

  const isMulti = param.longType === "list";

  const value = isMulti
    ? param.value.map((v) => ({ label: v, value: v }))
    : param.value
      ? { label: param.value, value: param.value }
      : null;

  const onChange = (value) => {
    if (!value) {
      return store.params.setOption(
        param,
        isMulti ? [] : (param.default ?? ""),
      );
    }

    return store.params.setOption(
      param,
      isMulti ? value.map((v) => v.value) : value.value,
    );
  };

  const options = param.options.map((option) => ({
    value: option,
    label: option,
  }));

  return (
    <Select
      id={param.long}
      ref={(ref) => store.params.setRef(param.long, ref)}
      chakraStyles={selectStyle}
      placeholder={param.longType}
      isMulti={isMulti}
      isClearable={param.clearable}
      closeMenuOnSelect={!isMulti}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
};

const InputParameter = ({ param }: { param: any }) => {
  const store = useStore();

  return (
    <Input
      id={param.long}
      name={param.long}
      w={parameterControlWidth}
      bg="white"
      borderColor={param.active ? "blue.300" : "gray.300"}
      borderWidth="1px"
      _hover={{ bg: "white", borderColor: "gray.400" }}
      _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "outline" }}
      fontSize="xs"
      h="1.875rem"
      variant="outline"
      placeholder={param.default}
      value={param.value}
      onChange={(e) => store.params.setInput(param, e.target.value)}
    />
  );
};

const FileInputParameter = ({ param }: { param: any }) => {
  const store = useStore();

  const onDrop = (files) => {
    if (files.length < 1) return;

    const file = files[0];

    const reader = new FileReader();

    reader.onloadend = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      if (!value || !param.tabName) return;
      store.setActiveInput(param.tabName);
      store.params.setFileParam(param, {
        name: file.name,
        value,
      });
    };

    reader.readAsText(file, "utf-8");
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "text/plain": param.accept },
    noClick: true, // Turn off default click trigger to prevent double file requests
  });

  const { ref, ...rootProps } = getRootProps();

  return (
    <Button variant="outline" size="xs" w={parameterControlWidth} asChild>
      <label
        ref={ref as Ref<HTMLLabelElement>}
        htmlFor={param.long}
        {...rootProps}
      >
        Load file
        <input id={param.long} {...getInputProps()} />
      </label>
    </Button>
  );
};

const ToggleParameter = ({ param }: { param: InfomapParameter }) => {
  const store = useStore();

  return (
    <ToggleSwitch
      id={param.long}
      checked={param.active}
      ariaLabel={param.longString}
      onChange={() => store.params.toggle(param.long)}
    />
  );
};

const IncrementalParameter = ({ param }: { param: any }) => {
  const store = useStore();
  const { value, maxValue, stringValue } = param;

  const setValue = (value) => store.params.setIncremental(param, value);

  return (
    <ButtonGroup
      variant="outline"
      attached
      size="xs"
      id={param.long}
      w={parameterControlWidth}
    >
      <IconButton
        aria-label="minus"
        flex="0 0 2.25rem"
        disabled={value === 0}
        onClick={() => setValue(value - 1)}
      >
        <LuMinus />
      </IconButton>
      <Button disabled={value === 0} flex="1 1 auto">
        {stringValue(value)}
      </Button>
      <IconButton
        aria-label="plus"
        flex="0 0 2.25rem"
        disabled={value === maxValue}
        onClick={() => setValue(value + 1)}
      >
        <LuPlus />
      </IconButton>
    </ButtonGroup>
  );
};

const ParameterControl = ({ param }: { param: InfomapParameter }) => {
  if (param.dropdown) return <DropdownParameter param={param} />;
  if (param.input) return <InputParameter param={param} />;
  if (param.incremental) return <IncrementalParameter param={param} />;
  if (param.file) return <FileInputParameter param={param} />;

  return <ToggleParameter param={param} />;
};

const isToggleOnlyParameter = (param: InfomapParameter) =>
  !param.dropdown && !param.input && !param.incremental && !param.file;

function ParamName({
  param,
  short = false,
}: {
  param: InfomapParameter;
  short?: boolean;
}) {
  const name =
    short && param.shortString
      ? stripFlagPrefix(param.shortString)
      : parameterLabel(param);

  return (
    <code
      style={{
        backgroundColor: "transparent",
        border: 0,
        fontSize: "0.78rem",
        fontWeight: 500,
        lineHeight: 1.4,
        padding: 0,
        userSelect: "none",
        color: "rgb(45, 55, 72)",
      }}
      title={param.longString}
    >
      {name}
    </code>
  );
}

const ParameterGroup = ({
  group,
  advanced,
  query,
}: {
  group: string;
  advanced: boolean;
  query: string;
}) => {
  const store = useStore();

  const matchPriority = (match: ParameterMatch) =>
    match === "name" ? 0 : match === "description" ? 1 : 2;
  const params = store.params
    .getParamsForGroup(group)
    .filter((param) => !param.advanced || advanced || param.active)
    .map((param) => ({ param, match: parameterMatchType(param, query) }))
    .filter((entry) => entry.match !== null)
    .sort((a, b) => {
      const advancedDiff =
        a.param.advanced === b.param.advanced ? 0 : a.param.advanced ? 1 : -1;
      if (advancedDiff !== 0) return advancedDiff;
      return matchPriority(a.match) - matchPriority(b.match);
    });

  const id = `Params${group}`;

  if (params.length === 0) return null;

  return (
    <>
      <Text
        id={id}
        color="gray.500"
        fontFamily="monospace"
        fontSize="0.68rem"
        fontWeight={700}
        letterSpacing="0.12em"
        textTransform="uppercase"
        mt={4}
        mb={1.5}
      >
        {group}
      </Text>
      <Box borderTopWidth="1px" borderTopColor="gray.200">
        {params.map(({ param }, key) => {
          const textToggles = isToggleOnlyParameter(param);

          return (
            <HStack
              key={key}
              alignItems="flex-start"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
              px={2}
              py={2}
              borderBottomWidth="1px"
              borderBottomColor="gray.200"
              _last={{ borderBottomWidth: 0 }}
              _hover={textToggles ? { bg: "gray.50" } : undefined}
            >
              <Box flex="1 1 13rem" minW={0}>
                <Box
                  aria-label={
                    textToggles ? `Toggle ${param.longString}` : undefined
                  }
                  as={textToggles ? "button" : "div"}
                  bg="transparent"
                  border={0}
                  cursor={textToggles ? "pointer" : undefined}
                  display="block"
                  onClick={
                    textToggles
                      ? () => store.params.toggle(param.long)
                      : undefined
                  }
                  p={0}
                  textAlign="left"
                  w="100%"
                >
                  <HStack lineHeight={1.35} gap={1.5}>
                    <Box fontSize="xs">
                      <ParamName param={param} />
                    </Box>
                    {paramShortcut(param.long) && (
                      <Kbd
                        fontSize="0.65rem"
                        title={`Press ${paramShortcut(param.long)} to toggle`}
                      >
                        {paramShortcut(param.long)}
                      </Kbd>
                    )}
                    {param.active && (
                      <Box
                        aria-label="Active"
                        bg="blue.500"
                        borderRadius="full"
                        boxShadow="0 0 0 2px rgba(49, 130, 206, 0.14)"
                        h="0.375rem"
                        title="Active"
                        w="0.375rem"
                      />
                    )}
                  </HStack>
                  <Box
                    color="gray.500"
                    fontSize="xs"
                    lineHeight={1.38}
                    mt={0.5}
                  >
                    {param.description ? (
                      <HighlightedText text={param.description} query={query} />
                    ) : null}
                  </Box>
                </Box>
              </Box>
              <Box
                flex="0 0 auto"
                maxW="100%"
                minW="4rem"
                display="flex"
                pt={0.5}
                justifyContent="flex-end"
              >
                <ParameterControl param={param} />
              </Box>
            </HStack>
          );
        })}
      </Box>
    </>
  );
};

export default function Parameters() {
  const store = useStore();
  const [advanced, setAdvanced] = useState(false);
  const [search, setSearch] = useState("");
  const query = normalizeSearch(search);

  useEffect(() => {
    if (!window.location.hash) return;

    const hash = window.location.hash.slice(1);
    const param = store.params.getParam(hash);

    if (param?.advanced) {
      setAdvanced(true);
    }
  }, [store.params.getParam]);

  // Remember what `advanced` was when the search began, so we can restore it
  // when the search is cleared — and never override the user's manual toggle.
  const prevQueryRef = useRef("");
  const advancedBeforeSearchRef = useRef<boolean | null>(null);

  useEffect(() => {
    const prevQuery = prevQueryRef.current;
    prevQueryRef.current = query;

    if (!prevQuery && query) {
      advancedBeforeSearchRef.current = advanced;
    }

    if (prevQuery && !query) {
      if (advancedBeforeSearchRef.current !== null) {
        setAdvanced(advancedBeforeSearchRef.current);
        advancedBeforeSearchRef.current = null;
      }
      return;
    }

    if (!query) return;

    const hasAdvancedMatch = parameterGroups.some((group) =>
      store.params
        .getParamsForGroup(group)
        .some((param) => param.advanced && parameterMatches(param, query)),
    );

    if (hasAdvancedMatch) {
      setAdvanced(true);
    }
    // `advanced` is read only at the empty→non-empty transition; intentionally
    // not in deps so manual toggles while searching don't get overridden.
  }, [query, store.params.getParamsForGroup]);

  const hasResults = parameterGroups.some((group) =>
    store.params
      .getParamsForGroup(group)
      .some(
        (param) =>
          (!param.advanced || advanced || param.active) &&
          parameterMatches(param, query),
      ),
  );

  return (
    <>
      <Box position="relative" mb={2}>
        <Box
          position="absolute"
          left={3}
          top="50%"
          transform="translateY(-50%)"
          color="gray.500"
          pointerEvents="none"
          zIndex={1}
        >
          <LuSearch size={16} />
        </Box>
        <Input
          aria-label="Search parameters"
          id="parameters-search"
          name="parameters-search"
          placeholder="Search parameters…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            setSearch("");
            event.currentTarget.blur();
          }}
          pl={9}
          pr={search ? 9 : 3}
          size="sm"
          bg="white"
        />
        {search && (
          <Box
            as="button"
            aria-label="Clear search"
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            bg="transparent"
            border={0}
            p={1}
            color="gray.500"
            cursor="pointer"
            borderRadius="sm"
            _hover={{ color: "gray.900", bg: "gray.100" }}
            zIndex={1}
            onClick={() => setSearch("")}
          >
            <LuX size={14} />
          </Box>
        )}
      </Box>

      <HStack
        alignItems="center"
        justifyContent="space-between"
        gap={3}
        py={2}
        mb={1}
      >
        <Text color="gray.700" fontSize="xs" fontWeight={700} mb={0}>
          Advanced
        </Text>
        <ToggleSwitch
          id="show-advanced"
          checked={advanced}
          ariaLabel="Show advanced parameters"
          onChange={() => setAdvanced(!advanced)}
        />
      </HStack>

      {hasResults ? (
        parameterGroups.map((group) => (
          <ParameterGroup
            key={group}
            group={group}
            advanced={advanced}
            query={query}
          />
        ))
      ) : (
        <Text color="gray.500" fontSize="xs" mt={4}>
          No parameters match "{search}".
        </Text>
      )}
    </>
  );
}
